from rest_framework.routers import DefaultRouter
from apps.checkout.views import CartViewSet, CartItemViewSet

router = DefaultRouter()
router.register(r"cart", CartViewSet, basename="cart")
router.register(r"items", CartItemViewSet, basename="cart-item")

urlpatterns = router.urls
