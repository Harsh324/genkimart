import django_filters
from .models import CartItem


class CartItemFilter(django_filters.FilterSet):
    product = django_filters.UUIDFilter(field_name="product_id")

    class Meta:
        model = CartItem
        fields = ["product"]
