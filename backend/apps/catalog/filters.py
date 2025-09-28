import django_filters
from apps.catalog.models import Product, Category


class ProductFilter(django_filters.FilterSet):
    # filter by category (id or name)
    category = django_filters.ModelChoiceFilter(
        field_name="category", queryset=Category.objects.all()
    )
    category_name = django_filters.CharFilter(
        field_name="category__name", lookup_expr="icontains"
    )

    # price filters (based on Product.price)
    price_min = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = django_filters.NumberFilter(field_name="price", lookup_expr="lte")

    # active flag
    is_active = django_filters.BooleanFilter(field_name="is_active")

    # stock availability
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")

    def filter_in_stock(self, queryset, name, value):
        if value is True:
            return queryset.filter(stock_quantity__gt=0)
        elif value is False:
            return queryset.filter(stock_quantity__lte=0)
        return queryset

    class Meta:
        model = Product
        fields = [
            "category",
            "category_name",
            "is_active",
            "price_min",
            "price_max",
            "in_stock",
        ]
