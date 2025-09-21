from django.apps import AppConfig


class CheckoutConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.checkout"

    def ready(self) -> None:
        # Register signal handlers
        from . import signals  # noqa: F401
