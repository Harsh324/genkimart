import uuid
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import F, Sum

from apps.common.models import TimeStampedModel


class Cart(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # exactly one cart per user
    user = models.OneToOneField(
        getattr(settings, "AUTH_USER_MODEL", "auth.User"),
        on_delete=models.CASCADE,
        related_name="cart",
    )

    def __str__(self) -> str:
        return f"Cart<{self.user_id}>"

    @property
    def subtotal_amount(self) -> int:
        # compute live from Product.price to keep single source of truth
        total = self.items.aggregate(total=Sum(F("quantity") * F("product__price")))[
            "total"
        ]
        return int(total or 0)


class CartItem(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")

    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.PROTECT,
        related_name="cart_lines",
    )
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])

    class Meta:
        ordering = ["cart_id", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["cart", "product"], name="uq_cartitem_cart_product"
            ),
        ]
        indexes = [
            models.Index(
                fields=["cart", "created_at"], name="ix_cartitem_cart_created"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.product_title} ×{self.quantity}"

    @property
    def unit_price(self):
        return self.product.price

    @property
    def line_total(self):
        return self.quantity * self.product.price
