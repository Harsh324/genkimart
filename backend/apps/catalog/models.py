import uuid
from django.db import models
from django.utils.text import slugify
from django.conf import settings
from django.core.validators import MinValueValidator, RegexValidator
from apps.common.models import TimeStampedModel

from django.db.models import F, MaxValueValidator  # Add this import


class Category(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True, db_index=True)
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
    images = models.JSONField(default=list, blank=True)  # [{url, alt}]
    attributes = models.JSONField(
        default=dict, blank=True
    )  # {"material": "cotton", ...}
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

    # Sale pricing - optional
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

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

        if self.attributes:
            self.attributes = dict(
                sorted(
                    self.attributes.items(),
                    key=lambda x: (
                        x[1].get("rank", 999) if isinstance(x[1], dict) else 999
                    ),
                )
            )

    def __str__(self):
        return self.title

    # Pricing Methods
    @property
    def current_price(self):
        """Get the current applicable price amount"""
        if self.is_on_sale():
            return self.sale_price_amount
        return self.price_amount

    @property
    def is_on_sale(self):
        """Check if product is currently on sale"""
        if not self.sale_price_amount:
            return False
        return True

    @property
    def discount_percentage(self):
        """Get discount percentage if on sale"""
        if not self.is_on_sale():
            return 0

        if self.price_amount <= 0:
            return 0

        discount = (
            (self.price_amount - self.sale_price_amount) / self.price_amount
        ) * 100
        return round(discount, 2)

    @property
    def current_price_display(self):
        """Get formatted price for display"""
        amount = self.current_price

        # Format based on currency

        symbol = self.currency_symbols.get(self.price_currency, self.price_currency)

        if self.price_currency == "JPY":
            # JPY doesn't use decimal places
            return f"{symbol}{amount:,}"
        else:
            # Other currencies typically use 2 decimal places
            return f"{symbol}{amount/100:,.2f}"

    @property
    def original_price_dispaly(self):
        """Get formatted original price (useful for showing strikethrough)"""

        symbol = self.currency_symbols.get(self.price_currency, self.price_currency)

        if self.price_currency == "JPY":
            return f"{symbol}{self.price_amount:,}"
        else:
            return f"{symbol}{self.price_amount/100:,.2f}"

    # Stock methods
    @property
    def in_stock(self) -> bool:
        return self.stock_quantity > 0

    def decrement_stock(self, qty: int = 1) -> int:
        """
        Atomically subtract qty if available. Returns rows updated (0 or 1).
        """
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
        indexes = [models.Index(fields=["product", "created_at"])]

    def __str__(self):
        return f"Review {self.rating}★ on {self.product}"
