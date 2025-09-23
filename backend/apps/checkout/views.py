from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

from .serializers import CartItemSerializer
from .services import get_cart, serialize_cart, clear_cart, upsert_cart_item, CartError


class CartViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        cart = get_cart(request.user)
        return Response(serialize_cart(cart), status=status.HTTP_200_OK)

    @action(detail=False, methods=["delete"])
    def clear(self, request):
        cart = get_cart(request.user)
        clear_cart(cart)
        return Response(serialize_cart(cart), status=status.HTTP_200_OK)

    @transaction.atomic
    def create(self, request):
        cart = get_cart(request.user)
        serializer = CartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data["product"]
        quantity = serializer.validated_data.get("quantity")

        try:
            upsert_cart_item(cart, product, quantity)
        except CartError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serialize_cart(cart), status=status.HTTP_200_OK)
