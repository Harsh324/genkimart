import uuid
from django.core.validators import MinValueValidator
from django.db import models
from apps.common.models import TimeStampedModel, CURRENCY_VALIDATOR


class Payment(TimeStampedModel):
    class Status(models.TextChoices):
        REQUIRES_ACTION = "requires_action", "Requires action"
        AUTHORIZED = "authorized", "Authorized"
        CAPTURED = "captured", "Captured"
        PARTIALLY_REFUNDED = "partially_refunded", "Partially refunded"
        REFUNDED = "refunded", "Refunded"
        FAILED = "failed", "Failed"
        CANCELED = "canceled", "Canceled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="payments"
    )

    amount = models.IntegerField(validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, validators=[CURRENCY_VALIDATOR])

    provider = models.CharField(max_length=40)  # e.g. 'stripe'
    provider_ref = models.CharField(max_length=128, blank=True)  # charge/intent id
    status = models.CharField(
        max_length=24, choices=Status.choices, default=Status.AUTHORIZED
    )

    authorized_at = models.DateTimeField(null=True, blank=True)
    captured_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["order", "created_at"], name="ix_payment_order_created"
            ),
            models.Index(
                fields=["provider", "provider_ref"], name="ix_payment_provider_ref"
            ),
        ]

    def __str__(self) -> str:
        return f"Payment {self.get_status_display()} {self.amount} {self.currency}"


class Refund(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="refunds"
    )
    payment = models.ForeignKey(
        "payments.Payment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="refunds",
    )

    amount = models.IntegerField(validators=[MinValueValidator(1)])
    currency = models.CharField(max_length=3, validators=[CURRENCY_VALIDATOR])

    reason = models.CharField(max_length=200, blank=True)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING
    )
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["order", "created_at"], name="ix_refund_order_created")
        ]

    def __str__(self) -> str:
        return f"Refund {self.amount} {self.currency} ({self.get_status_display()})"
