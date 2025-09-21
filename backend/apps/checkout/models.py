import uuid
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.db.models import Q, F, Sum

from apps.common.models import TimeStampedModel, CURRENCY_VALIDATOR


class Status(models.TextChoices):
    ACTIVE = "active", "Active"
    CONVERTED = "converted", "Converted to Order"
    ABANDONED = "abandoned", "Abandoned"


class Cart(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        CONVERTED = "converted", "Converted to Order"
        ABANDONED = "abandoned", "Abandoned"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        getattr(settings, "AUTH_USER_MODEL", "auth.User"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="carts",
    )
    session_key = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.ACTIVE
    )
    currency = models.CharField(
        max_length=3, validators=[CURRENCY_VALIDATOR], default="JPY"
    )
    coupon_code = models.CharField(max_length=40, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                check=Q(user__isnull=False) | Q(session_key__isnull=False),
                name="ck_cart_has_identity",
            ),
            models.UniqueConstraint(
                fields=["user", "status"],
                condition=Q(status=Status.ACTIVE) & Q(user__isnull=False),
                name="uq_cart_one_active_per_user",
            ),
            models.UniqueConstraint(
                fields=["session_key", "status"],
                condition=Q(status=Status.ACTIVE) & Q(session_key__isnull=False),
                name="uq_cart_one_active_per_session",
            ),
        ]

    def __str__(self) -> str:
        who = self.user_id or self.session_key or "anon"
        return f"Cart<{who}> {self.currency} {self.status}"

    @property
    def subtotal_amount(self) -> int:
        agg = self.items.aggregate(total=Sum(F("unit_price_amount") * F("quantity")))
        return int(agg["total"] or 0)


class CartItem(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")

    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.PROTECT,
        related_name="cart_lines",
    )

    product_title = models.CharField(max_length=255)
    product_slug = models.SlugField(max_length=255)

    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    unit_price_amount = models.IntegerField(validators=[MinValueValidator(0)])
    price_currency = models.CharField(max_length=3, validators=[CURRENCY_VALIDATOR])

    class Meta:
        ordering = ["cart_id", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["cart", "product"], name="uq_cartitem_cart_product"
            ),
            models.CheckConstraint(
                check=Q(price_currency__regex=r"^[A-Z]{3}$"),
                name="ck_cartitem_currency_3letter",
            ),
            models.CheckConstraint(
                check=Q(unit_price_amount__gte=0),
                name="ck_cartitem_price_nonneg",
            ),
        ]
        indexes = [
            models.Index(
                fields=["cart", "created_at"], name="ix_cartitem_cart_created"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.product_title} ×{self.quantity}"


class Coupon(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=40, unique=True, db_index=True)

    percent_off = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    amount_off = models.IntegerField(
        null=True, blank=True, validators=[MinValueValidator(1)]
    )
    currency = models.CharField(
        max_length=3, validators=[CURRENCY_VALIDATOR], default="JPY"
    )

    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    active = models.BooleanField(default=True)

    max_redemptions = models.PositiveIntegerField(null=True, blank=True)
    times_redeemed = models.PositiveIntegerField(default=0)
    per_user_limit = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["code"]
        constraints = [
            models.CheckConstraint(
                check=(Q(percent_off__isnull=False) & Q(amount_off__isnull=True))
                | (Q(percent_off__isnull=True) & Q(amount_off__isnull=False)),
                name="ck_coupon_one_discount_type",
            ),
            models.CheckConstraint(
                check=Q(currency__regex=r"^[A-Z]{3}$"),
                name="ck_coupon_currency_3letter",
            ),
        ]

    def __str__(self) -> str:
        return self.code
