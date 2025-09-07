import uuid
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models, IntegrityError
from django.db.models import Q
from django.utils import timezone

from apps.common.models import TimeStampedModel, CURRENCY_VALIDATOR


class Order(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_PAYMENT = "pending_payment", "Pending payment"
        PAID = "paid", "Paid"
        PARTIALLY_REFUNDED = "partially_refunded", "Partially refunded"
        REFUNDED = "refunded", "Refunded"
        CANCELED = "canceled", "Canceled"

    class Fulfillment(models.TextChoices):
        UNFULFILLED = "unfulfilled", "Unfulfilled"
        PARTIAL = "partial", "Partially fulfilled"
        FULFILLED = "fulfilled", "Fulfilled"
        RETURNED = "returned", "Returned"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    number = models.CharField(max_length=26, unique=True, db_index=True)

    user = models.ForeignKey(
        getattr(settings, "AUTH_USER_MODEL", "auth.User"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    email = models.EmailField(blank=True)

    status = models.CharField(
        max_length=24, choices=Status.choices, default=Status.DRAFT
    )
    fulfillment_status = models.CharField(
        max_length=16, choices=Fulfillment.choices, default=Fulfillment.UNFULFILLED
    )
    currency = models.CharField(
        max_length=3, validators=[CURRENCY_VALIDATOR], default="JPY"
    )

    shipping_address = models.JSONField(default=dict)
    billing_address = models.JSONField(default=dict)

    subtotal_amount = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    discount_amount = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    shipping_amount = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    tax_amount = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    total_amount = models.IntegerField(validators=[MinValueValidator(0)], default=0)

    coupon_code = models.CharField(max_length=40, blank=True)

    placed_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    canceled_at = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_at"], name="ix_order_created"),
            models.Index(fields=["user", "created_at"], name="ix_order_user_created"),
            models.Index(fields=["status"], name="ix_order_status"),
        ]
        constraints = [
            models.CheckConstraint(
                check=Q(subtotal_amount__gte=0)
                & Q(discount_amount__gte=0)
                & Q(shipping_amount__gte=0)
                & Q(tax_amount__gte=0)
                & Q(total_amount__gte=0),
                name="ck_order_amounts_nonneg",
            ),
            models.CheckConstraint(
                check=Q(currency__regex=r"^[A-Z]{3}$"),
                name="ck_order_currency_3letter",
            ),
        ]

    def __str__(self) -> str:
        return f"Order {self.number} ({self.get_status_display()})"

    @staticmethod
    def _generate_number() -> str:
        today = timezone.now().strftime("%Y%m%d")
        rand = uuid.uuid4().hex[:12].upper()
        return f"ODR-{today}-{rand}"

    def save(self, *args, **kwargs):
        if not self.number:
            for _ in range(5):
                self.number = self._generate_number()
                try:
                    return super().save(*args, **kwargs)
                except IntegrityError:
                    self.number = None
            raise
        return super().save(*args, **kwargs)


class OrderItem(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")

    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_lines",
    )

    product_title = models.CharField(max_length=255)
    product_slug = models.SlugField(max_length=255)

    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    unit_price_amount = models.IntegerField(validators=[MinValueValidator(0)])
    price_currency = models.CharField(max_length=3, validators=[CURRENCY_VALIDATOR])

    class Meta:
        ordering = ["order_id", "-created_at"]
        constraints = [
            models.CheckConstraint(
                check=Q(unit_price_amount__gte=0),
                name="ck_orderitem_price_nonneg",
            ),
            models.CheckConstraint(
                check=Q(price_currency__regex=r"^[A-Z]{3}$"),
                name="ck_orderitem_currency_3letter",
            ),
        ]
        indexes = [
            models.Index(
                fields=["order", "created_at"], name="ix_orderitem_order_created"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.product_title} ×{self.quantity}"


class Shipment(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        RETURNED = "returned", "Returned"
        CANCELED = "canceled", "Canceled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="shipments")

    carrier = models.CharField(max_length=60, blank=True)
    service = models.CharField(max_length=60, blank=True)
    tracking_number = models.CharField(max_length=80, blank=True)

    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING
    )
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    address_snapshot = models.JSONField(default=dict)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["order", "created_at"], name="ix_shipment_order_created"
            ),
            models.Index(fields=["tracking_number"], name="ix_shipment_tracking"),
        ]

    def __str__(self) -> str:
        return f"Shipment {self.get_status_display()} for {self.order.number}"


class OrderCoupon(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="order_coupons"
    )
    coupon = models.ForeignKey(
        "checkout.Coupon", on_delete=models.PROTECT, related_name="applied_orders"
    )
    discounted_amount = models.IntegerField(validators=[MinValueValidator(1)])

    class Meta:
        indexes = [models.Index(fields=["order"], name="ix_ordercoupon_order")]
        constraints = [
            models.UniqueConstraint(
                fields=["order", "coupon"], name="uq_ordercoupon_once"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.coupon.code} → {self.order.number}"
