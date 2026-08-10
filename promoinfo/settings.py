from pathlib import Path
import os

from django.core.exceptions import ImproperlyConfigured
from django.core.management.utils import get_random_secret_key
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"
IS_VERCEL = os.getenv("VERCEL", "") == "1"


def _env_text(name: str, default: str = "") -> str:
    """Retorna o valor sem espaços ou o padrão quando ausente/vazio."""
    return os.getenv(name, "").strip() or default


def _env_bool(name: str, default: bool = False) -> bool:
    """Lê flags usuais sem transformar placeholder vazio em configuração falsa."""
    raw_value = os.getenv(name)
    if raw_value is None or not raw_value.strip():
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    """Lê inteiros aceitando placeholders vazios do painel da Vercel."""
    raw_value = os.getenv(name)
    if raw_value is None or not raw_value.strip():
        return default
    try:
        return int(raw_value.strip())
    except ValueError as exc:
        raise ImproperlyConfigured(f"{name} precisa ser um número inteiro.") from exc

# Em produção, variáveis do provedor têm prioridade. Em desenvolvimento, o .env
# local é a fonte explícita de configuração para evitar valores antigos herdados
# do terminal durante testes.
load_dotenv(ENV_FILE, override=False)
DEBUG = _env_bool("DJANGO_DEBUG", default=not IS_VERCEL)
if DEBUG and ENV_FILE.exists():
    load_dotenv(ENV_FILE, override=True)
    DEBUG = _env_bool("DJANGO_DEBUG", default=not IS_VERCEL)
SECRET_KEY = _env_text("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = get_random_secret_key()
    else:
        raise ImproperlyConfigured("DJANGO_SECRET_KEY precisa ser definida em produção.")

DEFAULT_ALLOWED_HOSTS = "promoinfo.vercel.app" if IS_VERCEL else "127.0.0.1,localhost"
ALLOWED_HOSTS = [
    host.strip()
    for host in _env_text("DJANGO_ALLOWED_HOSTS", DEFAULT_ALLOWED_HOSTS).split(",")
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
DB_ENGINE = _env_text(
    "PROMOINFO_DB_ENGINE", "postgresql" if IS_VERCEL else "sqlite"
).lower()

if DB_ENGINE == "postgresql":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": _env_text("PROMOINFO_DB_NAME", "postgres"),
            "USER": _env_text("PROMOINFO_DB_USER", "postgres"),
            "PASSWORD": _env_text("PROMOINFO_DB_PASSWORD"),
            "HOST": _env_text("PROMOINFO_DB_HOST"),
            "PORT": _env_text("PROMOINFO_DB_PORT", "5432"),
            "CONN_MAX_AGE": 0,
            "DISABLE_SERVER_SIDE_CURSORS": True,
            "OPTIONS": {
                "sslmode": _env_text("PROMOINFO_DB_SSLMODE", "require"),
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
TIME_ZONE = _env_text("PROMOINFO_TIME_ZONE", "America/Sao_Paulo")
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STATICFILES_DIRS = [
    BASE_DIR / "static",
]
# Google reCAPTCHA v2. As chaves oficiais de teste são públicas e documentadas
# pelo Google. Na Vercel elas mantêm o fluxo real do widget/SiteVerify quando o
# ambiente ainda não tem um par próprio; qualquer par real do ambiente prevalece.
RECAPTCHA_SANDBOX_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
RECAPTCHA_SANDBOX_SECRET_KEY = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"


def _recaptcha_credentials(is_vercel: bool) -> tuple[str, str, bool]:
    site_key = _env_text("RECAPTCHA_SITE_KEY")
    secret_key = _env_text("RECAPTCHA_SECRET_KEY")
    if bool(site_key) != bool(secret_key):
        raise ImproperlyConfigured(
            "RECAPTCHA_SITE_KEY e RECAPTCHA_SECRET_KEY precisam ser definidas em conjunto."
        )
    if site_key:
        return site_key, secret_key, False
    if is_vercel:
        return RECAPTCHA_SANDBOX_SITE_KEY, RECAPTCHA_SANDBOX_SECRET_KEY, True
    return "", "", False


def _recaptcha_allowed_hostnames(is_vercel: bool, sandbox: bool) -> list[str]:
    default_hostname = "promoinfo.vercel.app" if is_vercel else ""
    hostnames = [
        hostname.strip()
        for hostname in _env_text(
            "RECAPTCHA_ALLOWED_HOSTNAMES", default_hostname
        ).split(",")
        if hostname.strip()
    ]
    # O SiteVerify identifica as chaves públicas de teste com este hostname.
    if sandbox and "testkey.google.com" not in hostnames:
        hostnames.append("testkey.google.com")
    return hostnames


(
    RECAPTCHA_SITE_KEY,
    RECAPTCHA_SECRET_KEY,
    RECAPTCHA_SANDBOX_ENABLED,
) = _recaptcha_credentials(IS_VERCEL)
RECAPTCHA_ALLOWED_HOSTNAMES = _recaptcha_allowed_hostnames(
    IS_VERCEL, RECAPTCHA_SANDBOX_ENABLED
)

ASSISTANT_TOKEN = _env_text("PROMOINFO_ASSISTANT_TOKEN")
ASSISTANT_MODEL = _env_text("PROMOINFO_ASSISTANT_MODEL", "gemini-3.6-flash")


# Execução atrás de proxy HTTPS
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SESSION_COOKIE_SECURE = _env_bool("PROMOINFO_SECURE_COOKIES", default=IS_VERCEL)
CSRF_COOKIE_SECURE = SESSION_COOKIE_SECURE
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = _env_int("SESSION_COOKIE_AGE", 1800)

SECURE_SSL_REDIRECT = _env_bool("PROMOINFO_FORCE_HTTPS", default=IS_VERCEL)

SECURE_HSTS_SECONDS = _env_int(
    "PROMOINFO_HSTS_SECONDS", 31536000 if IS_VERCEL else 0
)
SECURE_HSTS_INCLUDE_SUBDOMAINS = SECURE_HSTS_SECONDS > 0
SECURE_HSTS_PRELOAD = SECURE_HSTS_SECONDS >= 31536000
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"
