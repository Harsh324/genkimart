from rest_framework import viewsets, permissions, status, filters as drf_filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.checkout.models import CartItem, Cart
from apps.checkout.serializers import (
    CartSerializer,
    CartItemSerializer,
    ApplyCouponSerializer,
    TotalsSerializer,
    ConfirmCheckoutSerializer,
)
from apps.checkout.filters import CartItemFilter
from apps.checkout.services import (
    get_or_create_active_cart,
    add_to_cart,
    update_line_quantity,
    remove_from_cart,
    apply_coupon,
    clear_coupon,
    compute_provisional_totals,
    finalize_checkout,
)
from apps.checkout.exceptions import CheckoutError


class DefaultPerm(permissions.IsAuthenticatedOrReadOnly):
    """Public read, authenticated write."""

    pass


def _current_cart(request) -> Cart:
    return get_or_create_active_cart(request)


class CartViewSet(viewsets.ViewSet):
    """
    Singleton-ish cart endpoint.
    - GET /checkout/cart/            -> current cart (list returns 1 item)
    - POST /checkout/cart/confirm/   -> finalize checkout (to order)
    - POST /checkout/cart/apply-coupon/
    - POST /checkout/cart/clear-coupon/
    - GET  /checkout/cart/totals/?shipping_estimate=&tax_estimate=
    """

    permission_classes = [DefaultPerm]

    def list(self, request):
        cart = _current_cart(request)
        data = CartSerializer(cart, context={"request": request}).data
        return Response(
            [data]
        )  # list returns a single-element array (lean to wire with DRF)

    @action(detail=False, methods=["get"], url_path="totals")
    def totals(self, request):
        cart = _current_cart(request)
        shipping_estimate = int(request.query_params.get("shipping_estimate", 0) or 0)
        tax_estimate = int(request.query_params.get("tax_estimate", 0) or 0)
        totals = compute_provisional_totals(
            cart, shipping_estimate=shipping_estimate, tax_estimate=tax_estimate
        )
        serializer = TotalsSerializer(totals.__dict__)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="apply-coupon")
    def apply_coupon_action(self, request):
        cart = _current_cart(request)
        ser = ApplyCouponSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            coupon = apply_coupon(cart, code=ser.validated_data["code"])
        except CheckoutError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"coupon_code": coupon.code})

    @action(detail=False, methods=["post"], url_path="clear-coupon")
    def clear_coupon_action(self, request):
        cart = _current_cart(request)
        clear_coupon(cart)
        return Response({"coupon_code": ""})

    @action(detail=False, methods=["post"], url_path="confirm")
    def confirm(self, request):
        cart = _current_cart(request)
        ser = ConfirmCheckoutSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            order = finalize_checkout(
                cart=cart,
                email=ser.validated_data["email"],
                shipping_address=ser.validated_data["shipping_address"],
                billing_address=ser.validated_data.get("billing_address"),
                shipping_amount=ser.validated_data["shipping_amount"],
                tax_amount=ser.validated_data["tax_amount"],
            )
        except CheckoutError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        # minimal response to avoid coupling to orders API; return order id/number
        return Response(
            {"order_id": str(order.id), "order_number": order.number},
            status=status.HTTP_201_CREATED,
        )


class CartItemViewSet(viewsets.ModelViewSet):
    """
    Items are implicitly scoped to the *current* cart.
    - POST   /checkout/items/              add (product, quantity)
    - PATCH  /checkout/items/{id}/         update quantity
    - DELETE /checkout/items/{id}/         remove
    - GET    /checkout/items/?product=...  list lines in current cart (filterable)
    """

    serializer_class = CartItemSerializer
    permission_classes = [DefaultPerm]
    filter_backends = [DjangoFilterBackend, drf_filters.OrderingFilter]
    filterset_class = CartItemFilter
    ordering_fields = ["created_at", "updated_at", "id"]
    ordering = ["-created_at"]

    def get_queryset(self):
        cart = _current_cart(self.request)
        return CartItem.objects.select_related("product", "cart").filter(cart=cart)

    def perform_create(self, serializer):
        cart = _current_cart(self.request)
        product = serializer.validated_data["product"]
        quantity = serializer.validated_data.get("quantity", 1)
        line = add_to_cart(cart, product=product, quantity=quantity)
        # return created line state
        serializer.instance = line

    def perform_update(self, serializer):
        # only quantity can change
        line = self.get_object()
        quantity = serializer.validated_data.get("quantity", line.quantity)
        update_line_quantity(line=line, quantity=quantity)
        line.refresh_from_db()
        serializer.instance = line

    def destroy(self, request, *args, **kwargs):
        line = self.get_object()
        remove_from_cart(line.cart, product=line.product)
        return Response(status=status.HTTP_204_NO_CONTENT)
