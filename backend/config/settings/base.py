import os
from pathlib import Path
from datetime import timedelta
from django.core.exceptions import ImproperlyConfigured

# TODO: Enable axes later in V2


# ---------- env helpers (fail fast) ----------
def env_required(name: str) -> str:
    v = os.getenv(name)
    if v is None or v.strip() == "":
        raise ImproperlyConfigured(f"Missing required environment variable: {name}")
    return v


def env_bool(name: str) -> bool:
    v = env_required(name).lower()
    if v in {"1", "true", "yes", "on"}:
        return True
    if v in {"0", "false", "no", "off"}:
        return False
    raise ImproperlyConfigured(f"Invalid boolean for {name}: {v}")


def env_list(name: str) -> list[str]:
    # Comma-separated; trims whitespace; empty items not allowed
    raw = env_required(name)
    parts = [p.strip() for p in raw.split(",")]
    if any(p == "" for p in parts):
        raise ImproperlyConfigured(f"Empty item in list env {name}")
    return parts


def env_int(name: str) -> int:
    try:
        return int(env_required(name))
    except ValueError as e:
        raise ImproperlyConfigured(f"Invalid int for {name}") from e


# ---------- paths ----------
BASE_DIR = Path(__file__).resolve().parents[2]  # repo/backend

# ---------- core ----------
SECRET_KEY = env_required("DJANGO_SECRET_KEY")
DEBUG = env_bool("DJANGO_DEBUG")
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS")  # e.g. "localhost,127.0.0.1,api.local"
CSRF_TRUSTED_ORIGINS = env_list("DJANGO_CSRF_TRUSTED_ORIGINS")
SITE_ID = 1

# ---------- apps ----------
INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    # 3rd-party
    "rest_framework",
    "django_filters",
    "drf_spectacular",
    # "axes",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.usersessions",
    "dj_rest_auth",
    "dj_rest_auth.registration",
    "rest_framework_simplejwt",
    "rest_framework.authtoken",
    "rest_framework_simplejwt.token_blacklist",
    # internal apps
    "apps.common",
    "apps.catalog",
    "apps.cart",
    "apps.orders",
]

# ---------- middleware (CSRF ON; keep prod-like) ----------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # "axes.middleware.AxesMiddleware",
]

ROOT_URLCONF = "config.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]
WSGI_APPLICATION = "config.wsgi.application"

# ---------- database (individual envs; no defaults) ----------
DB_ENGINE = env_required("DB_ENGINE")  # e.g. django.db.backends.postgresql
DB_NAME = env_required("DB_NAME")
DB_USER = env_required("DB_USER")
DB_PASSWORD = env_required("DB_PASSWORD")
DB_HOST = env_required("DB_HOST")
DB_PORT = env_required("DB_PORT")

DATABASES = {
    "default": {
        "ENGINE": DB_ENGINE,
        "NAME": DB_NAME,
        "USER": DB_USER,
        "PASSWORD": DB_PASSWORD,
        "HOST": DB_HOST,
        "PORT": DB_PORT,
    }
}

# ---------- auth/backends ----------
AUTHENTICATION_BACKENDS = [
    # "axes.backends.AxesStandaloneBackend",
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------- DRF / JWT ----------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 24,
}
REST_AUTH = {"USE_JWT": True, "JWT_AUTH_HTTPONLY": False}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env_int("JWT_ACCESS_MINUTES")),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env_int("JWT_REFRESH_DAYS")),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "UPDATE_LAST_LOGIN": True,
}

# ---------- i18n / tz ----------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------- static & media (absolute container paths from env; fail if missing) ----------
STATIC_URL = "/static/"
MEDIA_URL = "/media/"
STATIC_ROOT = env_required("STATIC_ROOT")  # should be "/static"
MEDIA_ROOT = env_required("MEDIA_ROOT")  # should be "/media"
STATICFILES_DIRS = []  # API-only

# ---------- security (all from env; no defaults) ----------
# behind nginx: typically set USE_X_FORWARDED_PROTO=1
USE_X_FORWARDED_PROTO = env_bool("USE_X_FORWARDED_PROTO")
if USE_X_FORWARDED_PROTO:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SESSION_COOKIE_SECURE = env_bool("SESSION_COOKIE_SECURE")
CSRF_COOKIE_SECURE = env_bool("CSRF_COOKIE_SECURE")
SECURE_HSTS_SECONDS = env_int("SECURE_HSTS_SECONDS")
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("SECURE_HSTS_INCLUDE_SUBDOMAINS")
SECURE_HSTS_PRELOAD = env_bool("SECURE_HSTS_PRELOAD")
SECURE_CONTENT_TYPE_NOSNIFF = env_bool("SECURE_CONTENT_TYPE_NOSNIFF")
SECURE_BROWSER_XSS_FILTER = env_bool(
    "SECURE_BROWSER_XSS_FILTER"
)  # Django still accepts this
X_FRAME_OPTIONS = env_required("X_FRAME_OPTIONS")  # e.g. "DENY" or "SAMEORIGIN"

# ---------- email (env decides backend) ----------
EMAIL_BACKEND = env_required("EMAIL_BACKEND")
DEFAULT_FROM_EMAIL = env_required("DEFAULT_FROM_EMAIL")
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "password2*"]
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_EMAIL_VERIFICATION = (
    "mandatory"  # “mandatory” means the user cannot log in until email is verified
)
ACCOUNT_CONFIRM_EMAIL_ON_GET = (
    True  # or False, depending on whether you want confirmation via GET
)
ACCOUNT_LOGIN_ON_EMAIL_CONFIRMATION = False
