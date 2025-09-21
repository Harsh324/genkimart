import django_filters
from django.db.models.functions import Coalesce

from apps.catalog.models import Product, Category


class ProductFilter(django_filters.FilterSet):
    # filter by category id OR by path prefix (e.g., /men or /men/shoes)
    category = django_filters.ModelChoiceFilter(
        field_name="category", queryset=Category.objects.all()
    )
    category_path = django_filters.CharFilter(method="filter_category_path")

    # price filters on effective price = COALESCE(sale_price_amount, price_amount)
    price_min = django_filters.NumberFilter(method="filter_price_min")
    price_max = django_filters.NumberFilter(method="filter_price_max")

    # common flags
    is_active = django_filters.BooleanFilter(field_name="is_active")
    currency = django_filters.CharFilter(field_name="price_currency")

    def filter_category_path(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(category__path__startswith=value.rstrip("/"))

    def _with_effective_price(self, queryset):
        return queryset.annotate(
            effective_price=Coalesce("sale_price_amount", "price_amount")
        )

    def filter_price_min(self, queryset, name, value):
        if value is None:
            return queryset
        qs = self._with_effective_price(queryset)
        return qs.filter(effective_price__gte=int(value))

    def filter_price_max(self, queryset, name, value):
        if value is None:
            return queryset
        qs = self._with_effective_price(queryset)
        return qs.filter(effective_price__lte=int(value))

    class Meta:
        model = Product
        fields = ["category", "is_active", "price_currency"]
