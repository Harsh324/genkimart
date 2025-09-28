from dataclasses import dataclass
from typing import Iterable
from django.db import transaction
from django.db.models import Prefetch
from apps.cart.services import get_cart, clear_cart  # reuse your helpers
from apps.catalog.models import Product
from .models import Order, OrderItem, Address


class OrderError(Exception):
    """Domain-level error for order placement."""


@dataclass
class LineSnapshot:
    product: Product
    quantity: int


def _create_address_for_user(user, data: dict, addr_type: Address.Type) -> Address:
    addr = Address(
        user=user,
        type=addr_type,
        full_name=data["full_name"],
        line1=data["line1"],
        line2=data.get("line2", "") or "",
        city=data["city"],
        prefecture=data["prefecture"],
        postal_code=data["postal_code"],
        country_code=data.get("country_code", "JP"),
        phone=data.get("phone", "") or "",
    )
    addr.full_clean()  # runs your normalization/validation
    addr.save()
    return addr


def _cart_lines(cart) -> Iterable[LineSnapshot]:
    # ensure products are already loaded
    items = cart.items.prefetch_related(
        Prefetch(
            "product",
            queryset=Product.objects.only(
                "id", "title", "price", "is_active", "stock_quantity"
            ),
        )
    ).all()
    for it in items:
        yield LineSnapshot(product=it.product, quantity=it.quantity)


@transaction.atomic
def place_order_for_user(
    user,
    shipping_address_data: dict,
    billing_address_data: dict | None,
    billing_same_as_shipping: bool,
) -> Order:
    cart = get_cart(user)
    lines = list(_cart_lines(cart))
    if not lines:
        raise OrderError("Cart is empty.")

    # stock checks + decrement
    for snap in lines:
        p = snap.product
        if not (getattr(p, "is_active", False) and getattr(p, "in_stock", False)):
            raise OrderError(f"Product unavailable: {p.title}")
        if p.decrement_stock(snap.quantity) == 0:
            raise OrderError(f"Insufficient stock: {p.title}")

    # addresses
    ship_addr = _create_address_for_user(
        user, shipping_address_data, Address.Type.SHIPPING
    )
    if billing_same_as_shipping:
        bill_addr = _create_address_for_user(
            user, shipping_address_data, Address.Type.BILLING
        )
    elif billing_address_data:
        bill_addr = _create_address_for_user(
            user, billing_address_data, Address.Type.BILLING
        )
    else:
        bill_addr = None

    order = Order.objects.create(
        user=user,
        subtotal_amount=cart.subtotal_amount,
        shipping_address=ship_addr,
        billing_address=bill_addr,
    )

    OrderItem.objects.bulk_create(
        [
            OrderItem(
                order=order,
                product=snap.product,
                product_title=snap.product.title,
                unit_price=snap.product.price,
                quantity=snap.quantity,
            )
            for snap in lines
        ]
    )

    clear_cart(cart)
    return order


@transaction.atomic
def cancel_order(order: Order) -> Order:
    if order.status not in {Order.Status.PENDING, Order.Status.PAID}:
        raise OrderError("Only pending/paid orders can be cancelled.")

    # Put stock back
    items = order.items.select_related("product")
    for it in items:
        it.product.increment_stock(it.quantity)

    order.status = Order.Status.CANCELLED
    order.save(update_fields=["status", "updated_at"])
    return order
