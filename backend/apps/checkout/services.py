from __future__ import annotations
from dataclasses import dataclass
from decimal import Decimal
from typing import Optional

from django.db import transaction
from django.utils import timezone
from django.db import IntegrityError

from apps.checkout.models import Cart, CartItem, Coupon
from apps.checkout.exceptions import CheckoutError
from apps.common.models import Address


# ---------- helpers ----------


def _get_session_key(request) -> Optional[str]:
    sk = getattr(getattr(request, "session", None), "session_key", None)
    return sk


def _normalize_code(code: str) -> str:
    return (code or "").strip().upper()


def _ensure_product_currency(cart: Cart, product) -> None:
    if getattr(product, "price_currency", None) != cart.currency:
        raise CheckoutError("Product currency does not match cart currency")


# ---------- selectors / identity ----------
def get_or_create_active_cart(
    request, *, currency: str = "JPY", refresh_expiry_days: int = 14
) -> Cart:
    """Return the ACTIVE cart for the current identity, creating if needed.

    - Authenticated user → keyed by user
    - Anonymous user → keyed by session_key

    No cross-identity merge/adopt logic here; merging is handled only by the login signal.
    """
    user = getattr(request, "user", None)
    session_key = _get_session_key(request)

    is_auth = getattr(user, "is_authenticated", False)
    if not is_auth and not session_key:
        raise CheckoutError(
            "Session key missing; EnsureSessionKeyMiddleware must run before checkout."
        )

    for _ in range(2):  # tiny retry
        try:
            with transaction.atomic():
                if is_auth:
                    cart = (
                        Cart.objects.select_for_update(skip_locked=True)
                        .filter(status=Cart.Status.ACTIVE, user=user)
                        .first()
                    )
                    if cart:
                        cart.refresh_expiry(refresh_expiry_days)
                        return cart
                    cart = Cart.objects.create(
                        user=user, status=Cart.Status.ACTIVE, currency=currency
                    )
                else:
                    cart = (
                        Cart.objects.select_for_update(skip_locked=True)
                        .filter(status=Cart.Status.ACTIVE, session_key=session_key)
                        .first()
                    )
                    if cart:
                        cart.refresh_expiry(refresh_expiry_days)
                        return cart
                    cart = Cart.objects.create(
                        session_key=session_key,
                        status=Cart.Status.ACTIVE,
                        currency=currency,
                    )
                cart.refresh_expiry(refresh_expiry_days)
                return cart
        except IntegrityError:
            # Another request created the ACTIVE cart between our read and create; refetch.
            continue

    # final fetch if both attempts raced
    qs = (
        Cart.objects.filter(status=Cart.Status.ACTIVE, user=user)
        if is_auth
        else Cart.objects.filter(status=Cart.Status.ACTIVE, session_key=session_key)
    )
    cart = qs.first()
    if not cart:
        raise CheckoutError("Could not obtain active cart; please retry.")
    cart.refresh_expiry(refresh_expiry_days)
    return cart


# ---------- cart line mutations ----------


def set_line_quantity(*, cart: Cart, product, quantity: int) -> Optional[CartItem]:
    """Authoritative mutator: create/update/delete line so that final quantity == `quantity`.
    Returns the CartItem, or None if the line ends up deleted.
    """
    _ensure_product_currency(cart, product)

    with transaction.atomic():
        # lock existing line if any
        line = (
            CartItem.objects.select_for_update()
            .filter(cart=cart, product=product)
            .first()
        )

        if quantity <= 0:
            if line:
                line.delete()
            cart.refresh_expiry()
            return None

        unit_price = int(getattr(product, "current_price"))
        if not line:
            # create fresh line at desired quantity
            line = CartItem.objects.create(
                cart=cart,
                product=product,
                product_title=product.title,
                product_slug=product.slug,
                quantity=int(quantity),
                unit_price_amount=unit_price,
                price_currency=cart.currency,
            )
        else:
            # update existing line to desired quantity
            line.quantity = int(quantity)
            line.save(update_fields=["quantity", "updated_at"])

        cart.refresh_expiry()
        return line


def update_cart_quantity(*, cart: Cart, product, delta: int) -> Optional[CartItem]:
    """Convenience: update cart by delta (can be negative)."""
    if delta == 0:
        return CartItem.objects.filter(cart=cart, product=product).first()  # no-op

    _ensure_product_currency(cart, product)
    with transaction.atomic():
        line = (
            CartItem.objects.select_for_update()
            .filter(cart=cart, product=product)
            .first()
        )

        current_qty = line.quantity if line else 0
        new_qty = int(current_qty) + int(delta)
        return set_line_quantity(cart=cart, product=product, quantity=new_qty)


# ---------- coupons ----------


def validate_coupon_for_cart(cart: Cart, *, code: str) -> Coupon:
    code_n = _normalize_code(code)
    coupon = Coupon.objects.filter(code=code_n, active=True).first()
    if not coupon:
        raise CheckoutError("Invalid or inactive coupon code")

    now = timezone.now()
    if coupon.starts_at and coupon.starts_at > now:
        raise CheckoutError("Coupon not yet active")
    if coupon.ends_at and coupon.ends_at < now:
        raise CheckoutError("Coupon has expired")
    if coupon.currency and coupon.currency != cart.currency:
        raise CheckoutError("Coupon currency mismatch")

    # Sanity: exactly one of percent_off / amount_off should be set.
    has_percent = coupon.percent_off is not None
    has_amount = coupon.amount_off is not None
    if has_percent == has_amount:
        raise CheckoutError("Coupon misconfigured")

    return coupon


def apply_coupon(cart: Cart, *, code: str) -> Coupon:
    coupon = validate_coupon_for_cart(cart, code=code)
    cart.coupon_code = coupon.code
    cart.save(update_fields=["coupon_code", "updated_at"])
    cart.refresh_expiry()
    return coupon


def clear_coupon(cart: Cart) -> None:
    if cart.coupon_code:
        cart.coupon_code = ""
        cart.save(update_fields=["coupon_code", "updated_at"])
    cart.refresh_expiry()


# ---------- totals (provisional) ----------


@dataclass(frozen=True)
class ProvisionalTotals:
    subtotal: int
    discount: int
    shipping_estimate: int
    tax_estimate: int
    total: int


def compute_provisional_totals(
    cart: Cart, *, shipping_estimate: int = 0, tax_estimate: int = 0
) -> ProvisionalTotals:
    subtotal = cart.subtotal_amount
    discount = 0
    if cart.coupon_code:
        try:
            coupon = validate_coupon_for_cart(cart, code=cart.coupon_code)
        except CheckoutError:
            coupon = None
        if coupon:
            if coupon.percent_off is not None:
                discount = int(
                    Decimal(subtotal) * (Decimal(coupon.percent_off) / Decimal(100))
                )
            else:
                discount = int(coupon.amount_off or 0)
            discount = max(0, min(discount, subtotal))

    total = max(0, subtotal - discount) + int(shipping_estimate) + int(tax_estimate)
    return ProvisionalTotals(
        subtotal=subtotal,
        discount=discount,
        shipping_estimate=int(shipping_estimate),
        tax_estimate=int(tax_estimate),
        total=int(total),
    )


# ---------- checkout orchestration (handoff to orders) ----------
def finalize_checkout(
    *,
    cart: Cart,
    email: str,
    shipping_address: dict | Address,
    billing_address: dict | Address | None = None,
    shipping_amount: int = 0,
    tax_amount: int = 0,
):
    """Thin wrapper that delegates immutable order creation to orders.services.

    Keeps the boundary clean: `checkout` owns pre-order state; `orders` owns the purchase record.
    """
    from apps.orders.services import (
        convert_cart_to_order,
    )  # local import to avoid app import cycles

    from apps.common.models import Address as AddressModel

    # Allow passing either snapshots (dict) or Address model instances
    def _to_snapshot(addr) -> dict:
        if not addr:
            return {}
        if isinstance(addr, dict):
            return addr
        if isinstance(addr, AddressModel):
            return {
                "full_name": addr.full_name,
                "line1": addr.line1,
                "line2": addr.line2,
                "city": addr.city,
                "state": addr.state,
                "postal_code": addr.postal_code,
                "country_code": addr.country_code,
                "phone": addr.phone,
                "type": addr.type,
            }
        raise CheckoutError("Unsupported address type")

    return convert_cart_to_order(
        cart=cart,
        email=email,
        shipping_address=_to_snapshot(shipping_address),
        billing_address=_to_snapshot(billing_address) if billing_address else None,
        shipping_amount=int(shipping_amount),
        tax_amount=int(tax_amount),
    )
