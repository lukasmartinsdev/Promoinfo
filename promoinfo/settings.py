from pathlib import Path
import os

from django.core.exceptions import ImproperlyConfigured
from django.core.management.utils import get_random_secret_key
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"
IS_VERCEL = os.getenv("VERCEL", "") == "1"

# Em produção, variáveis do provedor têm prioridade. Em desenvolvimento, o .env
# local é a fonte explícita de configuração para evitar valores antigos herdados
# do terminal durante testes.
load_dotenv(ENV_FILE, override=False)
DEBUG = os.getenv("DJANGO_DEBUG", "0" if IS_VERCEL else "1") == "1"
if DEBUG and ENV_FILE.exists():
    load_dotenv(ENV_FILE, override=True)
    DEBUG = os.getenv("DJANGO_DEBUG", "0" if IS_VERCEL else "1") == "1"
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
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
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

# SQLite é o padrão somente no desenvolvimento local. Produção usa o PostgreSQL
# configurado por variáveis de ambiente, sem alterar a integração existente.
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

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.ScryptPasswordHasher",
]

LANGUAGE_CODE = "pt-br"
TIME_ZONE = os.getenv("PROMOINFO_TIME_ZONE", "America/Sao_Paulo").strip() or "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STATICFILES_DIRS = [
    BASE_DIR / "static",
]
# Google reCAPTCHA v2. O par real vem exclusivamente do ambiente; nenhum valor
# de teste é embutido no código ou ativado automaticamente na Vercel.
RECAPTCHA_SITE_KEY = os.getenv("RECAPTCHA_SITE_KEY", "").strip()
RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY", "").strip()
if bool(RECAPTCHA_SITE_KEY) != bool(RECAPTCHA_SECRET_KEY):
    raise ImproperlyConfigured(
        "RECAPTCHA_SITE_KEY e RECAPTCHA_SECRET_KEY precisam ser definidas em conjunto."
    )

RECAPTCHA_ALLOWED_HOSTNAMES = [
    hostname.strip()
    for hostname in os.getenv(
        "RECAPTCHA_ALLOWED_HOSTNAMES",
        "promoinfo.vercel.app" if IS_VERCEL else "",
    ).split(",")
    if hostname.strip()
]

ASSISTANT_TOKEN = os.getenv("PROMOINFO_ASSISTANT_TOKEN", "").strip()
ASSISTANT_MODEL = (
    os.getenv("PROMOINFO_ASSISTANT_MODEL", "gemini-3.6-flash").strip()
    or "gemini-3.6-flash"
)


# Execução atrás de proxy HTTPS
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SESSION_COOKIE_SECURE = (
    os.getenv("PROMOINFO_SECURE_COOKIES", "0") == "1"
)
CSRF_COOKIE_SECURE = SESSION_COOKIE_SECURE
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = int(os.getenv("SESSION_COOKIE_AGE", "1800"))

SECURE_SSL_REDIRECT = (
    os.getenv("PROMOINFO_FORCE_HTTPS", "0") == "1"
)

SECURE_HSTS_SECONDS = int(
    os.getenv("PROMOINFO_HSTS_SECONDS", "0")
)
SECURE_HSTS_INCLUDE_SUBDOMAINS = SECURE_HSTS_SECONDS > 0
SECURE_HSTS_PRELOAD = SECURE_HSTS_SECONDS >= 31536000
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"
