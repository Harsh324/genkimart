import uuid
import re
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from apps.common.models import TimeStampedModel
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator, MinLengthValidator

# Accept "123-4567" or "1234567" (normalize to "123-4567" in clean()).
jp_postal_code_validator = RegexValidator(
    regex=r"^(\d{3}-\d{4}|\d{7})$",
    message="Enter a valid Japanese postal code (e.g., 100-0001 or 1000001).",
    code="invalid_postal_code",
)


class Address(TimeStampedModel):
    class Type(models.TextChoices):
        SHIPPING = "shipping", "Shipping"
        BILLING = "billing", "Billing"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        getattr(settings, "AUTH_USER_MODEL", "auth.User"),
        on_delete=models.CASCADE,
        related_name="addresses",
        null=True,
        blank=True,
    )
    type = models.CharField(max_length=16, choices=Type.choices, default=Type.SHIPPING)

    full_name = models.CharField(max_length=160, validators=[MinLengthValidator(1)])

    # JP convention: line1 for chōme/banchi/gō + building; line2 optional (room/floor).
    line1 = models.CharField(max_length=160, validators=[MinLengthValidator(1)])
    line2 = models.CharField(max_length=160, blank=True)

    city = models.CharField(max_length=120, validators=[MinLengthValidator(1)])
    prefecture = models.CharField(max_length=64, validators=[MinLengthValidator(1)])

    # Basic JP postal code validation; normalized in clean()
    postal_code = models.CharField(max_length=8, validators=[jp_postal_code_validator])

    country_code = models.CharField(max_length=2, default="JP")
    phone = models.CharField(max_length=40, blank=True)

    class Meta:
        ordering = ["-created_at", "full_name"]
        indexes = [
            models.Index(fields=["user", "type"], name="ix_address_user_type"),
            models.Index(fields=["country_code"], name="ix_address_country"),
            models.Index(fields=["postal_code"], name="ix_address_postal_code"),
        ]

    def clean(self):
        super().clean()

        # Normalize country code
        if self.country_code:
            self.country_code = self.country_code.upper()

        # Trim simple free-text fields
        for f in ("full_name", "line1", "line2", "city", "prefecture"):
            val = getattr(self, f, None)
            if isinstance(val, str):
                trimmed = val.strip()
                if val != trimmed:
                    setattr(self, f, trimmed)
                if f in ("full_name", "line1", "city", "prefecture") and not trimmed:
                    raise ValidationError({f: "This field cannot be blank."})

        # Normalize JP postcode to NNN-NNNN
        if self.postal_code:
            m7 = re.fullmatch(r"\d{7}", self.postal_code)
            m_h = re.fullmatch(r"\d{3}-\d{4}", self.postal_code)
            if m7 and not m_h:
                self.postal_code = f"{self.postal_code[:3]}-{self.postal_code[3:]}"
            elif not (m7 or m_h):
                raise ValidationError(
                    {
                        "postal_code": "Enter a valid Japanese postal code (e.g., 100-0001)."
                    }
                )

        if self.phone:
            self.phone = self.phone.strip()

    def __str__(self) -> str:
        return f"{self.full_name} • {self.country_code} {self.postal_code}"


class Order(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        CANCELLED = "cancelled", "Cancelled"
        FULFILLED = "fulfilled", "Fulfilled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        getattr(settings, "AUTH_USER_MODEL", "auth.User"),
        on_delete=models.PROTECT,
        related_name="orders",
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True
    )

    # snapshot totals
    subtotal_amount = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    shipping_address = models.ForeignKey(
        Address,  # adjust to your app label
        on_delete=models.PROTECT,
        related_name="shipping_orders",
        null=True,
        blank=True,
    )
    billing_address = models.ForeignKey(
        Address,  # adjust to your app label
        on_delete=models.PROTECT,
        related_name="billing_orders",
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"], name="ix_order_user_created"),
            models.Index(
                fields=["status", "created_at"], name="ix_order_status_created"
            ),
        ]

    def __str__(self) -> str:
        return f"Order<{self.id}> u={self.user_id} {self.status}"


class OrderItem(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")

    # keep FK plus a couple of snapshots for auditability
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.PROTECT, related_name="order_lines"
    )
    product_title = models.CharField(max_length=255)
    unit_price = models.IntegerField(validators=[MinValueValidator(0)])
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])

    class Meta:
        ordering = ["order_id", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["order", "product"], name="uq_orderitem_order_product"
            ),
        ]
        indexes = [
            models.Index(
                fields=["order", "created_at"], name="ix_orderitem_order_created"
            ),
        ]

    @property
    def line_total(self) -> int:
        return self.unit_price * self.quantity
