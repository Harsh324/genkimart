from rest_framework.routers import DefaultRouter
from apps.catalog.views import (
    CategoryViewSet,
    ProductViewSet,
    ProductImageViewSet,
    AttributeViewSet,
    ProductAttributeViewSet,
    ReviewViewSet,
)

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"products", ProductViewSet, basename="product")
router.register(r"images", ProductImageViewSet, basename="product-image")
router.register(r"attributes", AttributeViewSet, basename="attribute")
router.register(
    r"product-attributes", ProductAttributeViewSet, basename="product-attribute"
)
router.register(r"reviews", ReviewViewSet, basename="review")

urlpatterns = router.urls
