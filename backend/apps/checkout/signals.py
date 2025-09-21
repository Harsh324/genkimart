# apps/checkout/signals.py
from __future__ import annotations
from typing import Optional

from django.conf import settings
from django.contrib.auth.signals import user_logged_in
from django.db import transaction
from django.dispatch import receiver

from apps.checkout.models import Cart, CartItem


def _candidate_session_keys(request) -> list[str]:
    """
    Return all plausible anonymous cart identifiers, ordered by likelihood:
      1) The *old* session key from the request cookie (pre-login)
      2) The *current* (rotated) session key from request.session
    """
    cookie_name = getattr(settings, "SESSION_COOKIE_NAME", "sessionid")
    cookie_key = request.COOKIES.get(cookie_name)
    current_key = getattr(getattr(request, "session", None), "session_key", None)
    keys = []
    if cookie_key:
        keys.append(cookie_key)
    if current_key and current_key != cookie_key:
        keys.append(current_key)
    return keys


@receiver(user_logged_in)
def merge_session_cart_on_login(sender, user, request, **kwargs):
    """
    Robustly merge an anonymous session cart into the user's ACTIVE cart:

    - Identify anon cart by (a) cart_id in session, else (b) old cookie key, else (c) current session key.
    - Prefer user's ACTIVE cart as the merge target; otherwise adopt the anon cart.
    - Sum quantities for duplicate products; keep target unit price snapshot.
    - Archive the source cart to satisfy the 'one ACTIVE cart' constraints.
    """
    # Collect identifiers
    session_cart_id = None
    if getattr(request, "session", None):
        session_cart_id = request.session.get(
            "cart_id"
        )  # if you set this when creating anon carts
    key_candidates = _candidate_session_keys(request)

    if not (session_cart_id or key_candidates):
        return  # nothing to merge

    with transaction.atomic():
        # Lock possible anon carts (by explicit cart_id first, then by session_key candidates)
        session_cart_qs = Cart.objects.select_for_update().filter(
            status=Cart.Status.ACTIVE, user__isnull=True
        )

        if session_cart_id:
            session_cart_qs = session_cart_qs.filter(id=session_cart_id)
        else:
            session_cart_qs = session_cart_qs.filter(session_key__in=key_candidates)

        # If multiple match (rare), take the most recently updated
        session_cart: Optional[Cart] = session_cart_qs.order_by("-updated_at").first()
        if not session_cart:
            return

        # Lock the user's ACTIVE cart (target)
        user_cart: Optional[Cart] = (
            Cart.objects.select_for_update()
            .filter(status=Cart.Status.ACTIVE, user=user)
            .first()
        )

        # Already the same cart (e.g., previously adopted)
        if user_cart and user_cart.id == session_cart.id:
            user_cart.refresh_expiry()
            return

        # No user cart → adopt the session cart wholesale
        if user_cart is None:
            session_cart.user = user
            session_cart.save(update_fields=["user", "updated_at"])
            session_cart.refresh_expiry()
            return

        # Merge session_cart → user_cart
        if session_cart.currency != user_cart.currency:
            # Drop conflicting-currency lines from the session cart
            session_cart.items.exclude(price_currency=user_cart.currency).delete()

        # Move/merge lines
        for line in list(session_cart.items.select_related("product")):
            existing = (
                CartItem.objects.select_for_update()
                .filter(cart=user_cart, product=line.product)
                .first()
            )
            if existing:
                existing.quantity = existing.quantity + line.quantity
                existing.save(update_fields=["quantity", "updated_at"])
                line.delete()
            else:
                line.cart = user_cart
                line.save(update_fields=["cart", "updated_at"])

        # Merge coupon: keep user's if present; otherwise copy session's
        if not user_cart.coupon_code and session_cart.coupon_code:
            user_cart.coupon_code = session_cart.coupon_code

        user_cart.save(update_fields=["coupon_code", "updated_at"])
        user_cart.refresh_expiry()

        # Archive the session cart (source)
        session_cart.status = Cart.Status.ABANDONED
        session_cart.save(update_fields=["status", "updated_at"])
