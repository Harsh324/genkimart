# apps/catalog/views.py
from django.db.models import Prefetch, Count
from django.db.models.functions import Coalesce
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
    ProductListSerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
    AttributeSerializer,
    ProductAttributeSerializer,
    ReviewSerializer,
)
from apps.catalog.filters import ProductFilter


class DefaultPerm(permissions.IsAuthenticatedOrReadOnly):
    pass


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.select_related("parent").all()
    serializer_class = CategorySerializer
    permission_classes = [DefaultPerm]
    filter_backends = [drf_filters.SearchFilter, drf_filters.OrderingFilter]
    search_fields = ["name", "slug", "path"]
    ordering_fields = ["name", "path", "created_at"]
    ordering = ["path", "name"]


class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [DefaultPerm]
    filter_backends = [
        DjangoFilterBackend,
        drf_filters.SearchFilter,
        drf_filters.OrderingFilter,
    ]
    filterset_class = ProductFilter
    search_fields = ["title", "description", "slug"]
    ordering_fields = [
        "created_at",
        "title",
        "price_amount",
        "sale_price_amount",
        "is_active",
        "effective_price",
    ]
    ordering = ["-created_at"]

    def get_queryset(self):
        base = Product.objects.select_related("category").prefetch_related(
            Prefetch(
                "images", queryset=ProductImage.objects.order_by("sort_rank", "id")
            ),
        )
        if self.action == "retrieve":
            # detail: also prefetch attributes (with Attribute) and annotate review count
            base = base.prefetch_related(
                Prefetch(
                    "attributes",
                    queryset=ProductAttribute.objects.select_related(
                        "attribute"
                    ).order_by("sort_rank", "id"),
                )
            ).annotate(reviews_count=Count("reviews"))
        # Enable ordering by effective_price if requested
        ordering = self.request.query_params.get("ordering", "")
        if "effective_price" in ordering:
            base = base.annotate(
                effective_price=Coalesce("sale_price_amount", "price_amount")
            )
        return base

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer


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
