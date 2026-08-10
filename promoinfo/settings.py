from pathlib import Path
import os

from django.core.exceptions import ImproperlyConfigured
from django.core.management.utils import get_random_secret_key
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

# Em produção, variáveis do provedor têm prioridade. Em desenvolvimento, o .env
# local é a fonte explícita de configuração para evitar valores antigos herdados
# do terminal durante testes.
load_dotenv(ENV_FILE, override=False)
DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"
if DEBUG and ENV_FILE.exists():
    load_dotenv(ENV_FILE, override=True)
    DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "").strip()
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = get_random_secret_key()
    else:
        raise ImproperlyConfigured("DJANGO_SECRET_KEY precisa ser definida em produção.")

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "DJANGO_ALLOWED_HOSTS",
        "127.0.0.1,localhost",
    ).split(",")
    if host.strip()
]

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "marketplace",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "marketplace.middleware.SecurityHeadersMiddleware",
]

ROOT_URLCONF = "promoinfo.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "promoinfo.wsgi.application"
ASGI_APPLICATION = "promoinfo.asgi.application"

# SQLite é usado somente para a área restrita e o cadastro de funcionários.
# O marketplace continua usando localStorage até a futura integração com Supabase.
DB_ENGINE = os.getenv("PROMOINFO_DB_ENGINE", "sqlite").strip().lower()

if DB_ENGINE == "postgresql":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("PROMOINFO_DB_NAME", "postgres"),
            "USER": os.getenv("PROMOINFO_DB_USER", "postgres"),
            "PASSWORD": os.getenv("PROMOINFO_DB_PASSWORD", ""),
            "HOST": os.getenv("PROMOINFO_DB_HOST", ""),
            "PORT": os.getenv("PROMOINFO_DB_PORT", "5432"),
            "CONN_MAX_AGE": 0,
            "DISABLE_SERVER_SIDE_CURSORS": True,
            "OPTIONS": {
                "sslmode": os.getenv("PROMOINFO_DB_SSLMODE", "require"),
                "prepare_threshold": None,
            },
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STATICFILES_DIRS = [
    BASE_DIR / "static",
]
# Google reCAPTCHA v2
RECAPTCHA_TEST_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
RECAPTCHA_TEST_SECRET_KEY = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"

RECAPTCHA_TEST_MODE = (
    os.getenv("RECAPTCHA_TEST_MODE", "1" if DEBUG else "0") == "1"
)

RECAPTCHA_SITE_KEY = os.getenv("RECAPTCHA_SITE_KEY", "").strip()
RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY", "").strip()

if RECAPTCHA_TEST_MODE and DEBUG:
    RECAPTCHA_SITE_KEY = RECAPTCHA_SITE_KEY or RECAPTCHA_TEST_SITE_KEY
    RECAPTCHA_SECRET_KEY = RECAPTCHA_SECRET_KEY or RECAPTCHA_TEST_SECRET_KEY

RECAPTCHA_ALLOWED_HOSTNAMES = [
    hostname.strip()
    for hostname in os.getenv(
        "RECAPTCHA_ALLOWED_HOSTNAMES",
        ""
    ).split(",")
    if hostname.strip()
]


# Execução atrás de proxy HTTPS
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SESSION_COOKIE_SECURE = (
    os.getenv("PROMOINFO_SECURE_COOKIES", "0") == "1"
)
CSRF_COOKIE_SECURE = SESSION_COOKIE_SECURE

SECURE_SSL_REDIRECT = (
    os.getenv("PROMOINFO_FORCE_HTTPS", "0") == "1"
)

SECURE_HSTS_SECONDS = int(
    os.getenv("PROMOINFO_HSTS_SECONDS", "0")
)
