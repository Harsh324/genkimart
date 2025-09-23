from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Order
from .serializers import OrderSerializer, AddressSerializer
from .services import place_order_for_user, cancel_order, OrderError


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        # user-scoped orders
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("items__product")
            .order_by("-created_at")
        )

    # POST /orders/ -> create from current cart
    def create(self, request, *args, **kwargs):
        data = request.data or {}

        # minimal input schema
        shipping = data.get("shipping_address")
        billing = data.get("billing_address")
        same = bool(data.get("billing_same_as_shipping", True))

        # validate shipping (required)
        ship_ser = AddressSerializer(data=shipping)
        ship_ser.is_valid(raise_exception=True)

        # validate billing only if provided & not same-as-shipping
        bill_data = None
        if not same and billing:
            bill_ser = AddressSerializer(data=billing)
            bill_ser.is_valid(raise_exception=True)
            bill_data = bill_ser.validated_data

        try:
            order = place_order_for_user(
                user=request.user,
                shipping_address_data=ship_ser.validated_data,
                billing_address_data=bill_data,
                billing_same_as_shipping=same,
            )
        except OrderError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(self.get_serializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        try:
            order = cancel_order(order)
        except OrderError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(order).data, status=status.HTTP_200_OK)
