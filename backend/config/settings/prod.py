from .base import *  # noqa: F401, F403
# # config/settings.py
# from pathlib import Path
# from datetime import timedelta
# import warnings

# BASE_DIR = Path(__file__).resolve().parents[2]

# # ===== Core =====
# SECRET_KEY = "django-insecure-u#ne8=jf3ui&h8u)$aqp3_l-nb2pjs4=(ie$%+*aoaf5!3y&+7"
# DEBUG = True
# ALLOWED_HOSTS = ["*"]  # OK for dev only
# REST_AUTH = {"USE_JWT": True, "JWT_AUTH_HTTPONLY": False}  # <- required on v3+

# # ===== Apps =====
# INSTALLED_APPS = [
#     # Django
#     "django.contrib.admin",
#     "django.contrib.auth",
#     "django.contrib.contenttypes",
#     "django.contrib.sessions",
#     "django.contrib.messages",
#     "django.contrib.staticfiles",
#     "django.contrib.sites",  # <- required by allauth
#     # 3rd-party
#     "rest_framework",
#     "django_filters",
#     "drf_spectacular",
#     # AUTH
#     "axes",
#     "allauth",
#     "allauth.account",
#     "allauth.socialaccount",
#     # optional helper (ok to keep or remove):
#     "allauth.usersessions",
#     "dj_rest_auth",
#     "dj_rest_auth.registration",
#     "rest_framework_simplejwt",
#     "rest_framework.authtoken",  # harmless w/ JWT; required if not using JWT
#     "rest_framework_simplejwt.token_blacklist",  # enable if you want blacklist
#     # Internal
#     "apps.common",
#     "apps.catalog",
#     "apps.cart",
#     "apps.orders",
# ]

# # ===== Middleware (CSRF removed for dev) =====
# MIDDLEWARE = [
#     "django.middleware.security.SecurityMiddleware",
#     "django.contrib.sessions.middleware.SessionMiddleware",
#     "django.middleware.common.CommonMiddleware",
#     # "django.middleware.csrf.CsrfViewMiddleware",  # DISABLED (dev only)
#     "django.contrib.auth.middleware.AuthenticationMiddleware",
#     "allauth.account.middleware.AccountMiddleware",
#     "django.contrib.messages.middleware.MessageMiddleware",
#     "django.middleware.clickjacking.XFrameOptionsMiddleware",
#     "axes.middleware.AxesMiddleware",
# ]

# # ===== URLs / Templates / WSGI =====
# ROOT_URLCONF = "config.urls"
# TEMPLATES = [
#     {
#         "BACKEND": "django.template.backends.django.DjangoTemplates",
#         "DIRS": [],
#         "APP_DIRS": True,
#         "OPTIONS": {
#             "context_processors": [
#                 "django.template.context_processors.request",  # required by allauth
#                 "django.contrib.auth.context_processors.auth",
#                 "django.contrib.messages.context_processors.messages",
#             ],
#         },
#     },
# ]
# WSGI_APPLICATION = "config.wsgi.application"

# # ===== DB (dev) =====
# DATABASES = {
#     "default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}
# }

# # ===== Password validation =====
# AUTH_PASSWORD_VALIDATORS = [
#     {
#         "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
#     },
#     {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
#     {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
#     {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
# ]

# # ===== Backends =====
# AUTHENTICATION_BACKENDS = [
#     "axes.backends.AxesStandaloneBackend",
#     "django.contrib.auth.backends.ModelBackend",
#     "allauth.account.auth_backends.AuthenticationBackend",
# ]

# # ===== DRF (JWT-only; no SessionAuthentication => no CSRF) =====
# REST_FRAMEWORK = {
#     "DEFAULT_AUTHENTICATION_CLASSES": [
#         "rest_framework_simplejwt.authentication.JWTAuthentication",
#     ],
#     "DEFAULT_PERMISSION_CLASSES": [
#         "rest_framework.permissions.IsAuthenticatedOrReadOnly",
#     ],
#     "DEFAULT_FILTER_BACKENDS": [
#         "django_filters.rest_framework.DjangoFilterBackend",
#         "rest_framework.filters.SearchFilter",
#         "rest_framework.filters.OrderingFilter",
#     ],
#     "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
#     "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
#     "PAGE_SIZE": 24,
# }

# # ===== SimpleJWT =====
# SIMPLE_JWT = {
#     "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),  # dev-friendly
#     "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
#     "ROTATE_REFRESH_TOKENS": True,
#     "BLACKLIST_AFTER_ROTATION": True,  # set True if using blacklist app
#     "AUTH_HEADER_TYPES": ("Bearer",),
#     "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
#     "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
#     "UPDATE_LAST_LOGIN": True,
# }

# # ===== dj-rest-auth (use JWT) =====
# # For older docs: REST_USE_JWT = True
# # For newer releases, either of these is accepted; keep one:
# # REST_USE_JWT = True
# # REST_AUTH = {"USE_JWT": True}  # alternative style on newer versions

# # ===== Sites / Allauth =====
# SITE_ID = 1
# LOGIN_REDIRECT_URL = "/"
# LOGOUT_REDIRECT_URL = "/"

# ACCOUNT_LOGIN_METHODS = {"email"}  # how users can log in
# ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "password2*"]  # * = required

# # ===== Sessions (DB) =====
# SESSION_ENGINE = "django.contrib.sessions.backends.db"

# # ===== Security (dev) =====
# SESSION_COOKIE_SECURE = False
# # CSRF entirely disabled by removing middleware & SessionAuth (dev only)

# # ===== Axes =====
# AXES_FAILURE_LIMIT = 5
# AXES_COOLOFF_TIME = 1  # hour

# # ===== Email (console in dev) =====
# EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
# DEFAULT_FROM_EMAIL = "no-reply@localhost"

# # ===== I18N / TZ =====
# LANGUAGE_CODE = "en-us"
# TIME_ZONE = "UTC"
# USE_I18N = True
# USE_TZ = True

# # ===== Static =====
# STATIC_URL = "static/"
# STATIC_ROOT = BASE_DIR / "static"
# DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
# # settings.py (bottom)

# warnings.filterwarnings(
#     "ignore",
#     message=r"app_settings\.(USERNAME_REQUIRED|EMAIL_REQUIRED) is deprecated",
#     module=r"dj_rest_auth\.registration\.serializers",
# )
