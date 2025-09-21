from django.db import transaction
from django.utils import timezone

from apps.checkout.models import Cart
from apps.orders.models import Order, OrderItem, OrderCoupon
from apps.catalog.models import Product
from apps.checkout.exceptions import CheckoutError
from apps.checkout.services import validate_coupon_for_cart  # <-- reuse validator


def convert_cart_to_order(
    *,
    cart: Cart,
    email: str,
    shipping_address: dict,
    billing_address: dict | None = None,
    shipping_amount: int = 0,
    tax_amount: int = 0,
) -> Order:
    if cart.status != Cart.Status.ACTIVE:
        raise CheckoutError("Cart is not active")

    with transaction.atomic():
        items = list(cart.items.select_related("product"))
        if not items:
            raise CheckoutError("Cart is empty")

        # currency consistency (defensive)
        for line in items:
            if line.price_currency != cart.currency:
                raise CheckoutError(
                    "Cart contains mixed currencies; please start a new cart."
                )

        # Sanitize inputs
        shipping_amount = max(0, int(shipping_amount))
        tax_amount = max(0, int(tax_amount))

        subtotal = 0
        order_items: list[OrderItem] = []
        for line in items:
            product: Product | None = line.product
            if not product or not product.in_stock:
                raise CheckoutError(f"Product {line.product_title} is not available")

            # Atomic stock decrement (0/1 rows updated inside model)
            if not product.decrement_stock(line.quantity):
                raise CheckoutError(f"Insufficient stock for {line.product_title}")

            line_subtotal = int(line.unit_price_amount) * int(line.quantity)
            subtotal += line_subtotal
            order_items.append(
                OrderItem(
                    order=None,  # set after order created
                    product=product,
                    product_title=line.product_title,
                    product_slug=line.product_slug,
                    quantity=line.quantity,
                    unit_price_amount=line.unit_price_amount,
                    price_currency=line.price_currency,
                )
            )

        # Coupon: authoritative re-validation
        coupon_obj = None
        discount_amount = 0
        if cart.coupon_code:
            try:
                coupon_obj = validate_coupon_for_cart(cart, code=cart.coupon_code)
            except CheckoutError:
                coupon_obj = None

        if coupon_obj:
            if coupon_obj.percent_off is not None:
                # subtotal int * Decimal -> Decimal, int() truncates (OK for JPY)
                discount_amount = int(subtotal * (coupon_obj.percent_off / 100))
            elif coupon_obj.amount_off is not None:
                discount_amount = int(coupon_obj.amount_off)
            discount_amount = max(0, min(discount_amount, subtotal))

        total = max(0, subtotal - discount_amount) + shipping_amount + tax_amount

        order = Order.objects.create(
            user=cart.user,
            email=email,
            status=Order.Status.PENDING_PAYMENT,
            # fulfillment_status defaults to UNFULFILLED
            currency=cart.currency,
            shipping_address=shipping_address,
            billing_address=billing_address or shipping_address,
            subtotal_amount=subtotal,
            discount_amount=discount_amount,
            shipping_amount=shipping_amount,
            tax_amount=tax_amount,
            total_amount=total,
            coupon_code=coupon_obj.code if coupon_obj else "",  # <-- set it
            placed_at=timezone.now(),
        )

        for oi in order_items:
            oi.order = order
        OrderItem.objects.bulk_create(order_items)

        if coupon_obj and discount_amount > 0:
            OrderCoupon.objects.create(
                order=order,
                coupon=coupon_obj,
                discounted_amount=discount_amount,
            )
            # (optional) increment coupon counters here, if you enforce limits

        cart.status = Cart.Status.CONVERTED
        cart.expires_at = None  # optional: stop showing as expirable
        cart.save(update_fields=["status", "expires_at", "updated_at"])

        return order
