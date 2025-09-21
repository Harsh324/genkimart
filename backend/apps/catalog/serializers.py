# apps/catalog/serializers.py
from rest_framework import serializers

from apps.catalog.models import (
    Category,
    Product,
    ProductImage,
    Attribute,
    ProductAttribute,
    Review,
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "path", "parent", "created_at", "updated_at"]
        read_only_fields = ["id", "path", "created_at", "updated_at"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "url", "alt", "sort_rank", "is_primary", "product"]
        read_only_fields = ["id"]


class AttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attribute
        fields = ["id", "name"]
        read_only_fields = ["id"]


class ProductAttributeSerializer(serializers.ModelSerializer):
    attribute_name = serializers.CharField(source="attribute.name", read_only=True)

    class Meta:
        model = ProductAttribute
        fields = [
            "id",
            "product",
            "attribute",
            "attribute_name",
            "value_text",
            "sort_rank",
        ]
        read_only_fields = ["id", "attribute_name", "product"]


class ReviewSerializer(serializers.ModelSerializer):
    author = serializers.PrimaryKeyRelatedField(read_only=True)
    product_title = serializers.CharField(source="product.title", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "product",
            "product_title",
            "rating",
            "title",
            "body",
            "author",
            "author_name",
            "created_at",
        ]
        read_only_fields = ["id", "author", "product_title", "created_at"]

    def create(self, validated_data):
        user = getattr(
            getattr(self.context.get("request"), "user", None),
            "is_authenticated",
            False,
        )
        if user:
            validated_data["author"] = self.context["request"].user
        return super().create(validated_data)


# ---------- Product serializers
class ProductListSerializer(serializers.ModelSerializer):
    is_on_sale = serializers.BooleanField(read_only=True)
    current_price = serializers.IntegerField(read_only=True)
    current_price_display = serializers.CharField(read_only=True)

    images = ProductImageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "category",
            "category_name",
            "is_active",
            "price_amount",
            "price_currency",
            "sale_price_amount",
            "stock_quantity",
            # computed
            "is_on_sale",
            "current_price",
            "current_price_display",
            # relations
            "images",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "is_on_sale",
            "current_price",
            "current_price_display",
        ]


class ProductDetailSerializer(ProductListSerializer):
    # add attributes and review summary on detail only
    attributes = ProductAttributeSerializer(many=True, read_only=True)
    discount_percentage = serializers.FloatField(read_only=True)
    original_price_dispaly = serializers.CharField(read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + [
            "discount_percentage",
            "original_price_dispaly",
            "attributes",
            "reviews_count",
        ]
