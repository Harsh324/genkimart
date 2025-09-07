import uuid
from django.db import models
from django.db.models import Q, F
from django.utils.text import slugify
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from apps.common.models import TimeStampedModel


class Category(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, db_index=True)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="children",
    )
    path = models.CharField(
        max_length=255, help_text='e.g., "/men/shoes"', db_index=True, blank=True
    )

    class Meta:
        ordering = ["path", "name"]
        constraints = [
            # Root categories: slug unique when parent IS NULL
            models.UniqueConstraint(
                fields=["slug"],
                condition=Q(parent__isnull=True),
                name="uq_category_root_slug",
            ),
            # Non-root: unique per parent
            models.UniqueConstraint(
                fields=["parent", "slug"],
                condition=Q(parent__isnull=False),
                name="uq_category_parent_slug",
            ),
            # Path is globally unique (fast lookups + no dup paths)
            models.UniqueConstraint(
                fields=["path"],
                name="uq_category_path",
            ),
            # Disallow self-parent
            models.CheckConstraint(
                check=~Q(parent=F("id")),
                name="ck_category_not_self_parent",
            ),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)

        # build path from ancestors: /parent/child
        parts, node = [], self
        while node is not None:
            parts.append(node.slug or "")
            node = node.parent
        self.path = "/" + "/".join(reversed([p for p in parts if p]))
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(TimeStampedModel):
    CURRENCY_VALIDATOR = RegexValidator(
        regex=r"^[A-Z]{3}$",
        message="Currency must be a 3-letter ISO code (e.g., JPY, USD).",
    )
    currency_symbols = {
        "JPY": "¥",
        "USD": "$",
        "EUR": "€",
        "GBP": "£",
    }
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
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
    price_amount = models.IntegerField(
        help_text="Minor units (e.g., cents) - base price",
        validators=[MinValueValidator(0)],
    )
    price_currency = models.CharField(
        max_length=3, default="JPY", validators=[CURRENCY_VALIDATOR]
    )
    sale_price_amount = models.IntegerField(
        null=True,
        blank=True,
        help_text="Sale price in minor units (e.g., cents)",
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
            models.Index(
                fields=["is_active", "price_amount"], name="ix_product_active_price"
            ),
        ]
        constraints = [
            models.CheckConstraint(
                check=Q(price_amount__gte=0),
                name="ck_product_price_nonneg",
            ),
            models.CheckConstraint(
                check=Q(sale_price_amount__isnull=True) | Q(sale_price_amount__gte=0),
                name="ck_product_sale_nonneg",
            ),
            models.CheckConstraint(
                check=Q(sale_price_amount__isnull=True)
                | Q(sale_price_amount__lt=F("price_amount")),
                name="ck_product_sale_lt_price",
            ),
            # Postgres supports regex in CheckConstraint
            models.CheckConstraint(
                check=Q(price_currency__regex=r"^[A-Z]{3}$"),
                name="ck_product_currency_3letter",
            ),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    # Pricing Methods
    @property
    def is_on_sale(self):
        """Check if product is currently on sale"""
        return self.sale_price_amount is not None

    @property
    def current_price(self):
        """Get the current applicable price amount"""
        return self.sale_price_amount if self.is_on_sale else self.price_amount

    @property
    def discount_percentage(self):
        """Get discount percentage if on sale"""
        if not self.is_on_sale or self.price_amount <= 0:
            return 0
        discount = (
            (self.price_amount - self.sale_price_amount) / self.price_amount
        ) * 100
        return round(discount, 2)

    @property
    def current_price_display(self):
        """Get formatted price for display"""
        amount = self.current_price
        symbol = self.currency_symbols.get(self.price_currency, self.price_currency)
        if self.price_currency == "JPY":
            return f"{symbol}{amount:,}"
        return f"{symbol}{amount/100:,.2f}"

    @property
    def original_price_dispaly(self):
        """Get formatted original price (useful for showing strikethrough)"""
        symbol = self.currency_symbols.get(self.price_currency, self.price_currency)
        if self.price_currency == "JPY":
            return f"{symbol}{self.price_amount:,}"
        return f"{symbol}{self.price_amount/100:,.2f}"

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


# ========== PRODUCT IMAGES (normalized) ==========


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
