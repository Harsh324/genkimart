import random
import string
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model

from apps.catalog.models import (
    Category,
    Product,
    ProductImage,
    Attribute,
    ProductAttribute,
    Review,
)

ADJS = ["Classic", "Modern", "Premium", "Eco", "Urban", "Sport", "Casual", "Basic"]
NOUNS = ["Sneaker", "Jacket", "Tee", "Jeans", "Boot", "Bag", "Watch", "Cap", "Sandal"]
COLORS = ["Black", "White", "Navy", "Olive", "Grey", "Beige", "Red", "Blue"]
SIZES = ["XS", "S", "M", "L", "XL"]
MATERIALS = ["Cotton", "Wool", "Denim", "Leather", "Polyester", "Linen"]

PLACEHOLDER_IMG = "https://picsum.photos/seed/{seed}/800/800"


def rand_words(n=8):
    letters = string.ascii_lowercase
    words = []
    for _ in range(n):
        wlen = random.randint(3, 10)
        words.append("".join(random.choice(letters) for _ in range(wlen)))
    return " ".join(words).capitalize()


class Command(BaseCommand):
    help = "Populate catalog with quick dummy data (categories, products, images, attributes, reviews)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--products",
            type=int,
            default=40,
            help="How many products to create (approx).",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete existing catalog data before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **opts):
        product_target = max(1, int(opts["products"]))

        if opts["clear"]:
            self.stdout.write("Clearing existing data…")
            Review.objects.all().delete()
            ProductImage.objects.all().delete()
            ProductAttribute.objects.all().delete()
            Product.objects.all().delete()
            Attribute.objects.all().delete()
            Category.objects.all().delete()

        # ---- Users (for reviews) ----
        User = get_user_model()
        demo_users = []
        for i in range(3):
            email = f"user{i+1}@example.com"
            user, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": email
                    if hasattr(User, "username")
                    else email.split("@")[0]
                },
            )
            demo_users.append(user)

        # ---- Categories (flat) ----
        self.stdout.write("Creating categories…")
        cat_names = ["Shoes", "Tops", "Bottoms", "Accessories", "Bags", "Watches"]
        categories = []
        for name in cat_names:
            cat, _ = Category.objects.get_or_create(name=name)
            categories.append(cat)

        # ---- Attributes ----
        self.stdout.write("Creating attributes…")
        attr_color, _ = Attribute.objects.get_or_create(name="Color")
        attr_size, _ = Attribute.objects.get_or_create(name="Size")
        attr_material, _ = Attribute.objects.get_or_create(name="Material")

        # ---- Products + Images + Attributes + Reviews ----
        self.stdout.write("Creating products…")
        created_products = 0
        for i in range(product_target):
            category = random.choice(categories)
            title = f"{random.choice(ADJS)} {random.choice(NOUNS)}"
            price = random.randint(1500, 35000)
            stock_qty = max(0, int(random.gauss(30, 20)))

            product = Product.objects.create(
                title=title,
                description=rand_words(40),
                category=category,
                is_active=random.random() > 0.05,
                price=price,
                stock_quantity=stock_qty,
            )

            # Images
            primary_rank = random.randint(0, 2)
            for rank in range(3):
                ProductImage.objects.create(
                    product=product,
                    url=PLACEHOLDER_IMG.format(seed=f"{product.id.hex[:8]}-{rank}"),
                    alt=f"{product.title} image {rank+1}",
                    sort_rank=rank,
                    is_primary=(rank == primary_rank),
                )

            # Attributes
            ProductAttribute.objects.create(
                product=product,
                attribute=attr_color,
                value_text=random.choice(COLORS),
                sort_rank=10,
            )
            ProductAttribute.objects.create(
                product=product,
                attribute=attr_size,
                value_text=random.choice(SIZES),
                sort_rank=20,
            )
            ProductAttribute.objects.create(
                product=product,
                attribute=attr_material,
                value_text=random.choice(MATERIALS),
                sort_rank=30,
            )

            # Reviews
            for r in range(random.randint(0, 5)):
                use_fk_author = random.random() < 0.6 and demo_users
                author = random.choice(demo_users) if use_fk_author else None
                author_name = (
                    ""
                    if author
                    else f"{random.choice(['Alex','Sam','Jamie','Taylor','Kai','Mika'])} {random.choice(['S.','K.','R.','M.','A.'])}"
                )
                created_at = timezone.now() - timedelta(days=random.randint(0, 365))
                Review.objects.create(
                    product=product,
                    rating=random.randint(1, 5),
                    title=random.choice(
                        [
                            "Great!",
                            "Love it",
                            "Solid value",
                            "Not bad",
                            "Could be better",
                            "",
                        ]
                    ),
                    body=rand_words(50),
                    author=author,
                    author_name=author_name,
                    created_at=created_at,
                    updated_at=created_at,
                )

            created_products += 1

        self.stdout.write(
            self.style.SUCCESS(f"✔ Seed complete: {created_products} products")
        )
        self.stdout.write(
            f"Categories: {Category.objects.count()}, "
            f"Attributes: {Attribute.objects.count()}, "
            f"Products: {Product.objects.count()}, "
            f"Images: {ProductImage.objects.count()}, "
            f"Reviews: {Review.objects.count()}"
        )
