from rest_framework import serializers
from .models import Order, OrderItem, Address


class AddressSerializer(serializers.Serializer):
    full_name = serializers.CharField()
    line1 = serializers.CharField()
    line2 = serializers.CharField(required=False, allow_blank=True, default="")
    city = serializers.CharField()
    prefecture = serializers.CharField()
    postal_code = serializers.CharField()
    country_code = serializers.CharField(required=False, default="JP")
    phone = serializers.CharField(required=False, allow_blank=True, default="")


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.IntegerField(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_title",
            "unit_price",
            "quantity",
            "line_total",
        ]
        read_only_fields = ["id", "product_title", "unit_price", "line_total"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = serializers.SerializerMethodField()
    billing_address = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "status",
            "subtotal_amount",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def _addr(self, a: Address):
        if not a:
            return None
        return {
            "id": str(a.id),
            "full_name": a.full_name,
            "line1": a.line1,
            "line2": a.line2,
            "city": a.city,
            "prefecture": a.prefecture,
            "postal_code": a.postal_code,
            "country_code": a.country_code,
            "phone": a.phone,
            "type": a.type,
        }

    def get_shipping_address(self, obj):
        return self._addr(obj.shipping_address)

    def get_billing_address(self, obj):
        return self._addr(obj.billing_address)
