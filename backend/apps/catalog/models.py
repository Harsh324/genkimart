import uuid
from django.db import models
from django.db.models import Q, F
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.common.models import TimeStampedModel


class Category(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=160, unique=True)

    def __str__(self):
        return self.name


class Product(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        "catalog.Category",
        on_delete=models.PROTECT,
        related_name="products",
        db_index=True,
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether this product is visible to customers",
    )
    price = models.IntegerField(
        help_text="base price of product",
        validators=[MinValueValidator(0)],
    )
    stock_quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Number of items in stock",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["category", "is_active"], name="ix_product_cat_active"
            ),
            models.Index(fields=["is_active", "price"], name="ix_product_active_price"),
        ]
        constraints = [
            models.CheckConstraint(
                check=Q(price__gte=0),
                name="ck_product_price_nonneg",
            ),
        ]

    # Stock methods
    @property
    def in_stock(self) -> bool:
        return self.stock_quantity > 0

    def decrement_stock(self, qty: int = 1) -> int:
        if qty <= 0:
            return 0
        updated = Product.objects.filter(pk=self.pk, stock_quantity__gte=qty).update(
            stock_quantity=F("stock_quantity") - qty
        )
        if updated:
            self.refresh_from_db(fields=["stock_quantity"])
        return updated

    def increment_stock(self, qty: int = 1) -> None:
        if qty <= 0:
            return
        Product.objects.filter(pk=self.pk).update(
            stock_quantity=F("stock_quantity") + qty
        )
        self.refresh_from_db(fields=["stock_quantity"])


class ProductImage(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images"
    )
    url = models.URLField(max_length=600)
    alt = models.CharField(max_length=255, blank=True)
    sort_rank = models.PositiveSmallIntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ["product_id", "sort_rank", "id"]
        indexes = [
            models.Index(fields=["product", "sort_rank"], name="ix_image_prod_pos"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["product", "sort_rank"],
                name="uq_image_product_sort_rank",
            ),
            # At most one primary image per product
            models.UniqueConstraint(
                fields=["product"],
                condition=Q(is_primary=True),
                name="uq_image_product_primary",
            ),
        ]

    def __str__(self):
        return f"{self.product.title} @ {self.position}"


class Attribute(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class ProductAttribute(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="attributes"
    )
    attribute = models.ForeignKey(
        Attribute, on_delete=models.PROTECT, related_name="product_values"
    )
    value_text = models.TextField()
    sort_rank = models.PositiveSmallIntegerField(default=999)

    class Meta:
        ordering = ["product_id", "sort_rank", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["product", "attribute"], name="uq_product_attribute_once"
            ),
        ]
        indexes = [
            models.Index(fields=["attribute"], name="ix_productattr_attribute"),
        ]

    def __str__(self):
        return f"{self.product.title} • {self.attribute.name} = {self.value_text}"


class Review(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="reviews"
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    title = models.CharField(max_length=160, blank=True)
    body = models.TextField(blank=True)
    author = models.ForeignKey(
        getattr(settings, "AUTH_USER_MODEL", "auth.User"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="product_reviews",
    )
    author_name = models.CharField(max_length=160, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["product", "created_at"], name="ix_review_product_created"
            )
        ]
        constraints = [
            models.CheckConstraint(
                check=Q(rating__gte=1) & Q(rating__lte=5),
                name="ck_review_rating_1_5",
            ),
            # ensure either FK author or a non-empty author_name is present
            models.CheckConstraint(
                check=Q(author__isnull=False) | ~Q(author_name=""),
                name="ck_review_has_some_author",
            ),
        ]

    def __str__(self):
        return f"Review {self.rating}★ on {self.product}"
