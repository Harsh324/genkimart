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
        fields = ["id", "name", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


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


class ProductSerializer(serializers.ModelSerializer):
    # related / computed fields
    category_name = serializers.CharField(source="category.name", read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    attributes = ProductAttributeSerializer(many=True, read_only=True)

    # expose model property
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "description",
            "category",
            "category_name",
            "is_active",
            "price",
            "stock_quantity",
            "in_stock",
            "images",
            "attributes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "in_stock",
        ]
