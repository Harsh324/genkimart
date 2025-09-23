# apps/catalog/views.py
from rest_framework import viewsets, permissions, filters as drf_filters
from django_filters.rest_framework import DjangoFilterBackend

from apps.catalog.models import (
    Category,
    Product,
    ProductImage,
    Attribute,
    ProductAttribute,
    Review,
)
from apps.catalog.serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductImageSerializer,
    AttributeSerializer,
    ProductAttributeSerializer,
    ReviewSerializer,
)
from apps.catalog.filters import ProductFilter


class DefaultPerm(permissions.IsAuthenticatedOrReadOnly):
    pass


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [DefaultPerm]
    filter_backends = [drf_filters.SearchFilter, drf_filters.OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["name" "created_at"]
    ordering = ["name"]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category")
    serializer_class = ProductSerializer
    permission_classes = [DefaultPerm]

    filter_backends = [
        DjangoFilterBackend,
        drf_filters.SearchFilter,
        drf_filters.OrderingFilter,
    ]

    filterset_class = ProductFilter

    search_fields = ["title", "description"]
    ordering_fields = [
        "created_at",
        "title",
        "price",
        "is_active",
        "stock_quantity",
    ]
    ordering = ["-created_at"]


class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.select_related("product").all()
    serializer_class = ProductImageSerializer
    permission_classes = [DefaultPerm]
    filter_backends = [drf_filters.OrderingFilter]
    ordering_fields = ["sort_rank", "id"]
    ordering = ["sort_rank", "id"]


class AttributeViewSet(viewsets.ModelViewSet):
    queryset = Attribute.objects.all()
    serializer_class = AttributeSerializer
    permission_classes = [DefaultPerm]
    filter_backends = [drf_filters.SearchFilter, drf_filters.OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["name", "id"]
    ordering = ["name"]


class ProductAttributeViewSet(viewsets.ModelViewSet):
    queryset = ProductAttribute.objects.select_related("product", "attribute").all()
    serializer_class = ProductAttributeSerializer
    permission_classes = [DefaultPerm]
    filter_backends = [
        DjangoFilterBackend,
        drf_filters.SearchFilter,
        drf_filters.OrderingFilter,
    ]
    filterset_fields = ["product", "attribute"]
    search_fields = ["value_text", "attribute__name", "product__title", "product__slug"]
    ordering_fields = ["sort_rank", "id"]
    ordering = ["sort_rank", "id"]


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.select_related("product", "author").all()
    serializer_class = ReviewSerializer
    permission_classes = [DefaultPerm]
    filter_backends = [
        DjangoFilterBackend,
        drf_filters.SearchFilter,
        drf_filters.OrderingFilter,
    ]
    filterset_fields = ["product", "rating"]
    search_fields = ["title", "body", "author_name", "product__title", "product__slug"]
    ordering_fields = ["created_at", "rating"]
    ordering = ["-created_at"]
