from __future__ import annotations

import json
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import timedelta

from django.conf import settings
from django.utils import timezone


def client_ip(request) -> str:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",", 1)[0].strip()[:64]
    return request.META.get("REMOTE_ADDR", "")[:64]


@dataclass
class RecaptchaResult:
    ok: bool
    configured: bool
    error: str = ""
    hostname: str = ""


def verify_recaptcha(request) -> RecaptchaResult:
    """Valida Google reCAPTCHA v2 no backend.

    Em desenvolvimento e na Vercel, a aplicação pode usar as chaves públicas
    de teste do Google quando nenhum par real estiver configurado.
    """
    secret = getattr(settings, "RECAPTCHA_SECRET_KEY", "").strip()
    site_key = getattr(settings, "RECAPTCHA_SITE_KEY", "").strip()
    if not secret or not site_key:
        if settings.DEBUG:
            return RecaptchaResult(ok=True, configured=False)
        return RecaptchaResult(ok=False, configured=False, error="reCAPTCHA não configurado no servidor.")

    token = request.POST.get("g-recaptcha-response", "").strip()
    if not token:
        return RecaptchaResult(ok=False, configured=True, error="Marque a opção ‘Não sou um robô’ para continuar.")

    # Token exclusivo para testes automatizados locais; nunca é aceito em produção.
    if (
        settings.DEBUG
        and getattr(settings, "RECAPTCHA_TEST_MODE", False)
        and site_key == getattr(settings, "RECAPTCHA_TEST_SITE_KEY", "")
        and secret == getattr(settings, "RECAPTCHA_TEST_SECRET_KEY", "")
        and token == "PROMOINFO_TEST_OK"
    ):
        return RecaptchaResult(ok=True, configured=True, hostname="localhost")

    payload = urllib.parse.urlencode({
        "secret": secret,
        "response": token,
        "remoteip": client_ip(request),
    }).encode()
    try:
        req = urllib.request.Request(
            "https://www.google.com/recaptcha/api/siteverify",
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=6) as response:
            result = json.loads(response.read().decode("utf-8"))
    except Exception:
        return RecaptchaResult(ok=False, configured=True, error="Não foi possível validar o reCAPTCHA. Tente novamente.")

    if not bool(result.get("success")):
        return RecaptchaResult(ok=False, configured=True, error="Verificação ‘Não sou um robô’ recusada. Tente novamente.")

    hostname = str(result.get("hostname") or "")[:253]
    allowed = set(getattr(settings, "RECAPTCHA_ALLOWED_HOSTNAMES", []))
    if allowed and hostname and hostname not in allowed and not settings.DEBUG:
        return RecaptchaResult(ok=False, configured=True, error="Origem do reCAPTCHA não autorizada.", hostname=hostname)

    return RecaptchaResult(ok=True, configured=True, hostname=hostname)


def login_is_blocked(LoginAttempt, username: str, ip: str) -> bool:
    since = timezone.now() - timedelta(minutes=15)
    recent = LoginAttempt.objects.filter(created_at__gte=since, success=False)
    by_user = recent.filter(username_key=username.lower()).count()
    by_ip = recent.filter(ip_address=ip).count()
    return by_user >= 5 or by_ip >= 12


def honeypot_ok(request) -> bool:
    return not request.POST.get("website", "").strip()
