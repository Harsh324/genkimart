from rest_framework import serializers

from apps.checkout.models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(read_only=True)
    product_slug = serializers.SlugField(read_only=True)
    price_currency = serializers.CharField(read_only=True)
    unit_price_amount = serializers.IntegerField(read_only=True)

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "product_title",
            "product_slug",
            "quantity",
            "unit_price_amount",
            "price_currency",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "product_title",
            "product_slug",
            "unit_price_amount",
            "price_currency",
            "created_at",
            "updated_at",
        ]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = [
            "id",
            "status",
            "currency",
            "coupon_code",
            "expires_at",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "currency",
            "expires_at",
            "created_at",
            "updated_at",
        ]


class ApplyCouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=40)


class TotalsSerializer(serializers.Serializer):
    subtotal = serializers.IntegerField()
    discount = serializers.IntegerField()
    shipping_estimate = serializers.IntegerField()
    tax_estimate = serializers.IntegerField()
    total = serializers.IntegerField()


class ConfirmCheckoutSerializer(serializers.Serializer):
    email = serializers.EmailField()
    shipping_address = serializers.DictField()
    billing_address = serializers.DictField(required=False)
    shipping_amount = serializers.IntegerField(min_value=0, default=0)
    tax_amount = serializers.IntegerField(min_value=0, default=0)
