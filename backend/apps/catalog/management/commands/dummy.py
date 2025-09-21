import random
import string
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
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
        parser.add_argument(
            "--currency",
            type=str,
            default="JPY",
            help="3-letter currency to use for prices (default: JPY).",
        )

    @transaction.atomic
    def handle(self, *args, **opts):
        product_target = max(1, int(opts["products"]))
        currency = opts["currency"].upper().strip()[:3]

        if opts["clear"]:
            self.stdout.write("Clearing existing data…")
            # Order matters to avoid FK constraint noise
            Review.objects.all().delete()
            ProductImage.objects.all().delete()
            ProductAttribute.objects.all().delete()
            Product.objects.all().delete()
            Attribute.objects.all().delete()
            Category.objects.all().delete()

        # ---- Users (for some reviews) ----
        User = get_user_model()
        demo_users = []
        for i in range(3):
            email = f"user{i+1}@example.com"
            user, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": email
                    if hasattr(User, "username")
                    else email.split("@")[0],
                },
            )
            demo_users.append(user)

        # ---- Categories (root + children) ----
        self.stdout.write("Creating categories…")
        roots_spec = {
            "men": ["shoes", "tops", "bottoms", "accessories"],
            "women": ["shoes", "tops", "bottoms", "accessories"],
            "kids": ["shoes", "tops"],
        }
        roots = {}
        leaves = []

        for root_name, subs in roots_spec.items():
            root, _ = Category.objects.get_or_create(
                name=root_name.capitalize(),
                parent=None,
                defaults={"slug": slugify(root_name)},
            )
            root.save()  # ensure path is built
            roots[root_name] = root
            for sub in subs:
                child, _ = Category.objects.get_or_create(
                    name=sub.capitalize(),
                    parent=root,
                    defaults={"slug": slugify(sub)},
                )
                child.save()  # ensures correct path
                leaves.append(child)

        # ---- Attributes ----
        self.stdout.write("Creating attributes…")
        attr_color, _ = Attribute.objects.get_or_create(name="Color")
        attr_size, _ = Attribute.objects.get_or_create(name="Size")
        attr_material, _ = Attribute.objects.get_or_create(name="Material")

        # ---- Products + Images + Attributes + Reviews ----
        self.stdout.write("Creating products…")
        created_products = 0
        for i in range(product_target):
            category = random.choice(leaves)

            title = f"{random.choice(ADJS)} {random.choice(NOUNS)}"
            slug = slugify(f"{title}-{category.slug}-{i}-{random.randint(1000, 9999)}")

            # Price in minor units. For JPY we treat as whole yen; for others use cents.
            base = random.randint(1500, 35000)  # sensible JPY range
            price_amount = base if currency == "JPY" else base * 100

            # ~40% chance to be on sale with 10–40% discount
            if random.random() < 0.4:
                discount_pct = random.randint(10, 40)
                sale_amount = int(price_amount * (100 - discount_pct) / 100)
            else:
                sale_amount = None

            stock_qty = max(0, int(random.gauss(30, 20)))

            product = Product.objects.create(
                title=title,
                slug=slug,
                description=rand_words(40),
                category=category,
                is_active=random.random() > 0.05,  # a few inactive
                price_amount=price_amount,
                price_currency=currency,
                sale_price_amount=sale_amount,
                stock_quantity=stock_qty,
            )

            # Images: 3 per product, sort_rank unique, exactly one primary
            primary_rank = random.randint(0, 2)
            for rank in range(3):
                ProductImage.objects.create(
                    product=product,
                    url=PLACEHOLDER_IMG.format(seed=f"{product.id.hex[:8]}-{rank}"),
                    alt=f"{product.title} image {rank+1}",
                    sort_rank=rank,
                    is_primary=(rank == primary_rank),
                )

            # Attributes (unique per product)
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

            # Reviews (0–5 per product); satisfy check constraint (author or author_name)
            for r in range(random.randint(0, 5)):
                use_fk_author = random.random() < 0.6 and demo_users
                author = random.choice(demo_users) if use_fk_author else None
                author_name = (
                    ""
                    if use_fk_author
                    else f"{random.choice(['Alex','Sam','Jamie','Taylor','Kai','Mika'])} {random.choice(['S.', 'K.', 'R.', 'M.', 'A.'])}"
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
