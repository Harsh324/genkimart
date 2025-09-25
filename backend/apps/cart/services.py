from django.db import transaction
from django.db.models import prefetch_related_objects

from .models import Cart, CartItem
from apps.catalog.models import Product
from .serializers import CartSerializer


class CartError(Exception):
    """Domain-level error for cart operations."""


def get_cart(user) -> Cart:
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


def serialize_cart(cart: Cart) -> dict:
    """
    Avoid extra SELECT by prefetching onto the in-memory instance,
    then serializing that object directly.
    """
    prefetch_related_objects([cart], "items__product")
    return CartSerializer(cart).data


def clear_cart(cart: Cart) -> None:
    cart.items.all().delete()


@transaction.atomic
def upsert_cart_item(cart: Cart, product: Product, quantity: int | None) -> None:
    """
    quantity=None => increment by 1
    quantity>=1   => set to that quantity
    quantity<1    => remove the line (if exists)
    Raises CartError with user-facing message on business rule violations.
    """
    # availability check
    if not (
        getattr(product, "is_active", False) and getattr(product, "in_stock", False)
    ):
        raise CartError("Product unavailable.")

    # lock the row for this (cart, product) pair
    line_item = (
        CartItem.objects.select_for_update().filter(cart=cart, product=product).first()
    )

    current_qty = line_item.quantity if line_item else 0
    target_qty = current_qty + 1 if quantity is None else quantity

    # delete if target < 1
    if target_qty < 1:
        if line_item:
            line_item.delete()
        return

    # stock check
    if getattr(product, "stock_quantity", 0) < target_qty:
        raise CartError("Insufficient stock.")

    # upsert line item
    if line_item:
        line_item.quantity = target_qty
        line_item.save(update_fields=["quantity", "updated_at"])
    else:
        CartItem.objects.create(cart=cart, product=product, quantity=target_qty)
