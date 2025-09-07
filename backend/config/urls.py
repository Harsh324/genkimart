from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("v1/catalog/", include("apps.catalog.urls")),
    path("v1/checkout/", include("apps.checkout.urls")),
    path("v1/orders/", include("apps.orders.urls")),
    path("v1/payments/", include("apps.payments.urls")),
    path("v1/auht/", include("allauth.urls")),
]
