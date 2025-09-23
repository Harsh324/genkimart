# apps/cart/management/commands/seed_dummy_data.py

import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from faker import Faker

from apps.checkout.models import Cart, CartItem, Coupon
from apps.catalog.models import Product  # assumes you have Product model

fake = Faker()


class Command(BaseCommand):
    help = "Populate dummy data for Cart, CartItem, and Coupon (no args required)"

    def handle(self, *args, **options):
        User = get_user_model()

        # --- User ---
        user, _ = User.objects.get_or_create(
            username="dummy_user", defaults={"email": "dummy@example.com"}
        )

        # --- Coupons (respect discount type constraint) ---
        coupons_data = [
            {"code": "DUMMY10", "percent_off": 10, "amount_off": None},
            {"code": "DUMMY500", "percent_off": None, "amount_off": 500},
            {"code": "DUMMY20", "percent_off": 20, "amount_off": None},
        ]

        for data in coupons_data:
            Coupon.objects.get_or_create(
                code=data["code"],
                defaults={
                    "percent_off": data["percent_off"],
                    "amount_off": data["amount_off"],
                    "currency": "JPY",
                    "starts_at": timezone.now(),
                    "ends_at": timezone.now() + timezone.timedelta(days=30),
                    "active": True,
                },
            )

        # --- Ensure products exist ---
        products = Product.objects.all()
        if not products.exists():
            for i in range(5):
                Product.objects.create(
                    title=fake.word().title(),
                    slug=f"dummy-product-{i+1}",
                    price=random.randint(1000, 5000),
                    currency="JPY",
                )
            products = Product.objects.all()

        # --- Carts (respect unique active per user) ---
        # one active cart for user
        active_cart, _ = Cart.objects.get_or_create(
            user=user,
            status=Cart.Status.ACTIVE,
            defaults={
                "currency": "JPY",
                "coupon_code": random.choice(["", "DUMMY10", "DUMMY500"]),
            },
        )

        # one abandoned cart for same user
        abandoned_cart = Cart.objects.create(
            user=user,
            status=Cart.Status.ABANDONED,
            currency="JPY",
            coupon_code="",
        )

        # one converted cart tied to session (anon)
        converted_cart = Cart.objects.create(
            user=None,
            session_key="sess12345",
            status=Cart.Status.CONVERTED,
            currency="JPY",
        )

        # --- CartItems (respect unique cart+product constraint) ---
        for cart in [active_cart, abandoned_cart, converted_cart]:
            for product in random.sample(list(products), k=min(3, products.count())):
                CartItem.objects.get_or_create(
                    cart=cart,
                    product=product,
                    defaults={
                        "product_title": product.title,
                        "product_slug": product.slug,
                        "quantity": random.randint(1, 3),
                        "unit_price_amount": random.randint(1000, 5000),
                        "price_currency": "JPY",
                    },
                )

        self.stdout.write(self.style.SUCCESS("✅ Dummy data created successfully"))
