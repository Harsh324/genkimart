from rest_framework import serializers
from .models import Cart, CartItem
from apps.catalog.serializers import ProductSerializer
from apps.catalog.models import Product


class CartItemSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.only("id"))

    class Meta:
        model = CartItem
        fields = ["id", "product", "quantity"]  # keep it lean

    def to_representation(self, obj):
        data = super().to_representation(obj)
        # replace PK with nested product on reads
        data["product"] = ProductSerializer(obj.product).data
        data["line_total"] = obj.quantity * obj.product.price
        return data


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal_amount = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items", "subtotal_amount", "created_at", "updated_at"]
        read_only_fields = fields
