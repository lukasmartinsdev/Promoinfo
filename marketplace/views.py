from __future__ import annotations

import json
import logging
import mimetypes
from pathlib import Path

from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate, get_user_model, login, logout, update_session_auth_hash
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.http import FileResponse, Http404, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.cache import never_cache

from .decorators import get_profile, require_capability, restricted_access
from .models import (
    MERCHANT_GROUP,
    MERCHANT_PASSWORD_CHANGE_GROUP,
    AuditEvent,
    Funcionario,
    LoginAttempt,
    UserProfile,
)
from .security import client_ip, honeypot_ok, login_is_blocked, verify_recaptcha
from .validators import limpar_cpf, validar_cpf
from .assistant_service import AssistantProviderError, answer_question, local_answer

PAGE_TEMPLATES = {
    "index": "index.html",
    "admin": "admin.html",
    "alugue": "alugue.html",
    "catalogo": "catalogo.html",
    "lojas": "lojas.html",
    "lojista": "lojista.html",
    "monte-seu-pc": "monte-seu-pc.html",
    "painel-lojista": "painel-lojista.html",
    "privacidade": "privacidade.html",
    "produto": "produto.html",
    "termos": "termos.html",
}
STATIC_SOURCE_DIR = (settings.BASE_DIR / "static").resolve()
logger = logging.getLogger(__name__)


def audit(request, action: str, target_type: str = "", target_id: str = "", detail: str = ""):
    AuditEvent.objects.create(
        actor=request.user if request.user.is_authenticated else None,
        action=action,
        target_type=target_type[:80],
        target_id=str(target_id)[:80],
        detail=detail[:500],
        ip_address=client_ip(request),
    )


def _is_merchant_user(user) -> bool:
    return bool(
        user.is_authenticated
        and user.is_active
        and user.groups.filter(name=MERCHANT_GROUP).exists()
    )


def _merchant_payload(user) -> dict:
    responsible_name = user.get_full_name().strip() or "Administrador PromoInfo"
    return {
        "id": f"django-{user.pk}",
        "email": user.email,
        "responsibleName": responsible_name,
        "tradeName": "PromoInfo",
        "remoteAuth": True,
        "mustChangePassword": user.groups.filter(
            name=MERCHANT_PASSWORD_CHANGE_GROUP
        ).exists(),
    }


@ensure_csrf_cookie
def render_page(request, page: str = "index"):
    template_name = PAGE_TEMPLATES.get(page)
    if template_name is None:
        raise Http404("Página não encontrada.")
    context = {}
    if page == "admin":
        profile = get_profile(request.user)
        if not profile or not profile.can_manage_users:
            return redirect(f"{reverse('login_restrito')}?next=/admin.html")
    if page == "lojista":
        context = {
            "recaptcha_enabled": bool(settings.RECAPTCHA_SITE_KEY and settings.RECAPTCHA_SECRET_KEY),
            "recaptcha_site_key": settings.RECAPTCHA_SITE_KEY,
        }
    return render(request, template_name, context)


@require_POST
def assistant_chat(request):
    ip = client_ip(request) or "unknown"
    rate_key = f"promoinfo:assistant:{ip}"
    count = cache.get(rate_key, 0)
    if count >= 10:
        return JsonResponse(
            {"ok": False, "error": "Muitas perguntas em pouco tempo. Aguarde um minuto e tente novamente."},
            status=429,
        )
    if count == 0:
        cache.set(rate_key, 1, timeout=60)
    else:
        try:
            cache.incr(rate_key)
        except ValueError:
            cache.set(rate_key, count + 1, timeout=60)

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JsonResponse({"ok": False, "error": "Pergunta inválida."}, status=400)

    question = str(payload.get("message") or "").strip()
    if not question:
        return JsonResponse({"ok": False, "error": "Digite uma pergunta para a Ana."}, status=400)
    if len(question) > 700:
        return JsonResponse({"ok": False, "error": "Sua pergunta ficou muito longa. Resuma em até 700 caracteres."}, status=400)

    limited = False
    try:
        answer = answer_question(question)
    except AssistantProviderError:
        limited = True
        answer = local_answer(question)
    except Exception as exc:
        limited = True
        logger.warning("Ana: erro inesperado no atendimento (%s).", type(exc).__name__)
        answer = local_answer(question)

    return JsonResponse(
        {
            "ok": True,
            "answer": answer,
            "assistant": "Ana",
            "limited": limited,
        }
    )


def _login_context(next_url: str = ""):
    return {
        "next": next_url,
        "recaptcha_enabled": bool(settings.RECAPTCHA_SITE_KEY and settings.RECAPTCHA_SECRET_KEY),
        "recaptcha_site_key": settings.RECAPTCHA_SITE_KEY,
        "security_version": "Acesso interno",
    }


@never_cache
def login_restrito(request):
    if request.user.is_authenticated and get_profile(request.user):
        return redirect("area_restrita")
    next_url = request.GET.get("next", "")

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")
        next_url = request.POST.get("next", "").strip()
        ip = client_ip(request)

        if not honeypot_ok(request):
            audit(request, "login.bot_blocked", detail="Honeypot preenchido")
            messages.error(request, "Não foi possível validar o acesso.")
            return render(request, "restrito/login.html", _login_context(next_url), status=400)

        if login_is_blocked(LoginAttempt, username, ip):
            audit(request, "login.rate_limited", detail=f"Usuário: {username[:80]}")
            messages.error(request, "Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.")
            return render(request, "restrito/login.html", _login_context(next_url), status=429)

        challenge = verify_recaptcha(request)
        if not challenge.ok:
            audit(request, "login.recaptcha_failed", detail=challenge.error)
            messages.error(request, challenge.error)
            return render(request, "restrito/login.html", _login_context(next_url), status=400)

        login_username = username
        if "@" in username:
            User = get_user_model()
            email_user = User.objects.filter(email__iexact=username).first()
            if email_user is not None:
                login_username = email_user.get_username()

        user = authenticate(request, username=login_username, password=password)
        success = bool(user and user.is_active and get_profile(user))
        LoginAttempt.objects.create(username_key=username.lower()[:150], ip_address=ip, success=success)

        if success:
            profile = get_profile(user)
            login(request, user)
            request.session.set_expiry(settings.SESSION_COOKIE_AGE)
            audit(request, "login.success", "user", user.pk, f"Perfil: {profile.role}; reCAPTCHA=ok")
            if next_url and url_has_allowed_host_and_scheme(next_url, allowed_hosts={request.get_host()}, require_https=request.is_secure()):
                return redirect(next_url)
            return redirect("area_restrita")

        audit(request, "login.failed", detail=f"Usuário informado: {username[:80]}")
        messages.error(request, "Usuário ou senha inválidos para a área restrita.")

    return render(request, "restrito/login.html", _login_context(next_url))


@restricted_access
@never_cache
def area_restrita(request):
    profile = get_profile(request.user)
    if profile.must_change_password:
        messages.info(request, "Por segurança, altere a senha provisória antes de continuar.")
        return redirect("alterar_minha_senha")
    funcionarios = Funcionario.objects.all()
    return render(request, "restrito/dashboard.html", {
        "profile": profile,
        "total_funcionarios": funcionarios.count(),
        "ultimos_funcionarios": funcionarios.order_by("-id")[:5],
        "recent_events": AuditEvent.objects.all()[:6] if profile.can_manage_users else [],
    })


@require_POST
@restricted_access
def logout_restrito(request):
    audit(request, "logout")
    logout(request)
    messages.success(request, "Você saiu da área restrita.")
    return redirect("login_restrito")


@require_capability("can_view_employees")
def listar_funcionarios(request):
    q = request.GET.get("q", "").strip()
    funcionarios = Funcionario.objects.all()
    if q:
        from django.db.models import Q
        clean = limpar_cpf(q)
        filtros = Q(nome__icontains=q) | Q(cargo__icontains=q)
        if clean:
            filtros |= Q(cpf__icontains=clean)
        funcionarios = funcionarios.filter(filtros)
    return render(request, "funcionarios/listar.html", {"funcionarios": funcionarios, "q": q, "profile": get_profile(request.user)})


@require_capability("can_create_employees")
def cadastrar_funcionario(request):
    form_data = {"nome": "", "cpf": "", "cargo": ""}
    if request.method == "POST":
        form_data = {k: request.POST.get(k, "").strip() for k in form_data}
        if not all(form_data.values()):
            messages.error(request, "Preencha todos os campos!")
        elif not validar_cpf(form_data["cpf"]):
            messages.error(request, "CPF inválido!")
        else:
            try:
                funcionario = Funcionario.objects.create(nome=form_data["nome"], cpf=limpar_cpf(form_data["cpf"]), cargo=form_data["cargo"], created_by=request.user)
                audit(request, "employee.created", "Funcionario", funcionario.pk, funcionario.nome)
                messages.success(request, "Funcionário cadastrado!")
                return redirect("cadastrar_funcionario")
            except IntegrityError:
                messages.error(request, "Já existe um funcionário cadastrado com este CPF.")
    return render(request, "funcionarios/cadastrar.html", {"form_data": form_data, "profile": get_profile(request.user)})


@require_capability("can_edit_employees")
def editar_funcionario(request, funcionario_id: int):
    funcionario = get_object_or_404(Funcionario, pk=funcionario_id)
    form_data = {"nome": funcionario.nome, "cpf": funcionario.cpf, "cargo": funcionario.cargo}
    if request.method == "POST":
        form_data = {k: request.POST.get(k, "").strip() for k in form_data}
        if not all(form_data.values()):
            messages.error(request, "Preencha todos os campos!")
        elif not validar_cpf(form_data["cpf"]):
            messages.error(request, "CPF inválido!")
        else:
            funcionario.nome = form_data["nome"]
            funcionario.cpf = limpar_cpf(form_data["cpf"])
            funcionario.cargo = form_data["cargo"]
            try:
                funcionario.save()
                audit(request, "employee.updated", "Funcionario", funcionario.pk, funcionario.nome)
                messages.success(request, "Funcionário atualizado!")
                return redirect("listar_funcionarios")
            except IntegrityError:
                messages.error(request, "Já existe um funcionário cadastrado com este CPF.")
            except ValidationError:
                messages.error(request, "Revise os dados informados antes de salvar.")
    return render(request, "funcionarios/editar.html", {"funcionario": funcionario, "form_data": form_data})


@require_POST
@require_capability("can_delete_employees")
def excluir_funcionario(request, funcionario_id: int):
    funcionario = get_object_or_404(Funcionario, pk=funcionario_id)
    nome = funcionario.nome
    audit(request, "employee.deleted", "Funcionario", funcionario.pk, nome)
    funcionario.delete()
    messages.success(request, f"{nome} foi excluído.")
    return redirect("listar_funcionarios")


@require_capability("can_manage_users")
def usuarios_permissoes(request):
    User = get_user_model()
    users = User.objects.filter(promoinfo_profile__isnull=False).select_related("promoinfo_profile").order_by("username")
    return render(request, "restrito/usuarios.html", {"users": users, "roles": UserProfile.ROLE_CHOICES})


@require_capability("can_manage_users")
def criar_usuario(request):
    data = {"username": "", "email": "", "role": UserProfile.CONSULTA}
    if request.method == "POST":
        data = {"username": request.POST.get("username", "").strip(), "email": request.POST.get("email", "").strip(), "role": request.POST.get("role", UserProfile.CONSULTA)}
        password = request.POST.get("password", "")
        if not data["username"] or not password:
            messages.error(request, "Usuário e senha provisória são obrigatórios.")
        elif data["role"] not in dict(UserProfile.ROLE_CHOICES):
            messages.error(request, "Perfil inválido.")
        else:
            User = get_user_model()
            try:
                validate_password(password)
            except ValidationError as exc:
                messages.error(request, " ".join(exc.messages))
                return render(request, "restrito/usuario_criar.html", {"form_data": data, "roles": UserProfile.ROLE_CHOICES})
            if User.objects.filter(username__iexact=data["username"]).exists():
                messages.error(request, "Este nome de usuário já está em uso.")
            else:
                user = User.objects.create_user(username=data["username"], email=data["email"], password=password, is_active=True, is_staff=True)
                profile = UserProfile.objects.create(user=user, role=data["role"], must_change_password=True)
                audit(request, "user.created", "User", user.pk, f"{user.username} / {profile.role}")
                messages.success(request, "Usuário criado com sucesso.")
                return redirect("usuarios_permissoes")
    return render(request, "restrito/usuario_criar.html", {"form_data": data, "roles": UserProfile.ROLE_CHOICES})


@require_POST
@require_capability("can_manage_users")
def atualizar_usuario(request, user_id: int):
    User = get_user_model()
    user = get_object_or_404(User, pk=user_id)
    profile = get_object_or_404(UserProfile, user=user)
    role = request.POST.get("role", profile.role)
    active = request.POST.get("is_active") == "on"
    if user == request.user and (role != UserProfile.MASTER or not active):
        messages.error(request, "O Administrador Master não pode remover o próprio acesso.")
        return redirect("usuarios_permissoes")
    if role in dict(UserProfile.ROLE_CHOICES):
        profile.role = role
        profile.save()
    user.is_active = active
    user.is_staff = True
    user.save(update_fields=["is_active", "is_staff"])
    audit(request, "user.permissions_updated", "User", user.pk, f"role={profile.role}; active={active}")
    messages.success(request, "Permissões atualizadas.")
    return redirect("usuarios_permissoes")


@require_capability("can_manage_users")
def seguranca_auditoria(request):
    events = AuditEvent.objects.select_related("actor")[:100]
    failed = LoginAttempt.objects.filter(success=False)[:50]
    return render(request, "restrito/seguranca.html", {"events": events, "failed_attempts": failed, "recaptcha_enabled": bool(settings.RECAPTCHA_SITE_KEY and settings.RECAPTCHA_SECRET_KEY)})



@require_POST
def merchant_security_challenge(request):
    username = request.POST.get("username", "").strip().lower()[:140]
    ip = client_ip(request)
    from django.utils import timezone
    from datetime import timedelta
    since = timezone.now() - timedelta(minutes=15)
    key = f"merchant:{username}"[:150]
    recent = LoginAttempt.objects.filter(created_at__gte=since).filter(ip_address=ip)
    if recent.count() >= 30 or LoginAttempt.objects.filter(created_at__gte=since, username_key=key).count() >= 15:
        return JsonResponse({"ok": False, "error": "Muitas tentativas. Aguarde alguns minutos."}, status=429)
    if not honeypot_ok(request):
        LoginAttempt.objects.create(username_key=key, ip_address=ip, success=False)
        return JsonResponse({"ok": False, "error": "Verificação anti-bot recusada."}, status=400)
    challenge = verify_recaptcha(request)
    LoginAttempt.objects.create(username_key=key, ip_address=ip, success=challenge.ok)
    if not challenge.ok:
        return JsonResponse({"ok": False, "error": challenge.error}, status=400)
    return JsonResponse({"ok": True})


@require_POST
@never_cache
def merchant_login(request):
    email = request.POST.get("email", "").strip().lower()[:150]
    password = request.POST.get("password", "")
    ip = client_ip(request)
    attempt_key = email

    if not honeypot_ok(request):
        LoginAttempt.objects.create(
            username_key=attempt_key,
            ip_address=ip,
            success=False,
        )
        audit(request, "merchant.login.bot_blocked")
        return JsonResponse(
            {"ok": False, "error": "Não foi possível validar o acesso."},
            status=400,
        )

    if login_is_blocked(LoginAttempt, attempt_key, ip):
        audit(request, "merchant.login.rate_limited", detail=email[:80])
        return JsonResponse(
            {"ok": False, "error": "Muitas tentativas. Aguarde alguns minutos."},
            status=429,
        )

    challenge = verify_recaptcha(request)
    if not challenge.ok:
        LoginAttempt.objects.create(
            username_key=attempt_key,
            ip_address=ip,
            success=False,
        )
        audit(request, "merchant.login.recaptcha_failed", detail=challenge.error)
        return JsonResponse({"ok": False, "error": challenge.error}, status=400)

    User = get_user_model()
    account = User.objects.filter(email__iexact=email).first() if email else None
    user = None
    if account is not None:
        user = authenticate(
            request,
            username=account.get_username(),
            password=password,
        )
    success = bool(user and _is_merchant_user(user))
    LoginAttempt.objects.create(
        username_key=attempt_key,
        ip_address=ip,
        success=success,
    )

    if not success:
        audit(request, "merchant.login.failed", detail=email[:80])
        return JsonResponse(
            {
                "ok": False,
                "error": "E-mail ou senha inválidos.",
                "localFallback": account is None,
            },
            status=401,
        )

    login(request, user)
    request.session.set_expiry(settings.SESSION_COOKIE_AGE)
    audit(
        request,
        "merchant.login.success",
        "User",
        user.pk,
        "reCAPTCHA=ok",
    )
    return JsonResponse({"ok": True, "merchant": _merchant_payload(user)})


@require_GET
@never_cache
def merchant_session(request):
    if not _is_merchant_user(request.user):
        return JsonResponse(
            {"ok": False, "error": "Sessão de lojista não encontrada."},
            status=401,
        )
    return JsonResponse({"ok": True, "merchant": _merchant_payload(request.user)})


@require_POST
def merchant_logout(request):
    if _is_merchant_user(request.user):
        audit(request, "merchant.logout", "User", request.user.pk)
    logout(request)
    return JsonResponse({"ok": True})


@require_POST
@never_cache
def merchant_change_password(request):
    if not _is_merchant_user(request.user):
        return JsonResponse(
            {"ok": False, "error": "Autenticação de lojista necessária."},
            status=401,
        )

    current_password = request.POST.get("currentPassword", "")
    new_password = request.POST.get("newPassword", "")
    confirmation = request.POST.get("newPasswordConfirm", "")
    if not request.user.check_password(current_password):
        return JsonResponse(
            {"ok": False, "error": "Senha atual incorreta."},
            status=400,
        )
    if new_password != confirmation:
        return JsonResponse(
            {"ok": False, "error": "As novas senhas não coincidem."},
            status=400,
        )
    try:
        validate_password(new_password, user=request.user)
    except ValidationError as exc:
        return JsonResponse(
            {"ok": False, "error": " ".join(exc.messages)},
            status=400,
        )

    request.user.set_password(new_password)
    request.user.save(update_fields=["password"])
    pending_group = Group.objects.filter(
        name=MERCHANT_PASSWORD_CHANGE_GROUP
    ).first()
    if pending_group is not None:
        request.user.groups.remove(pending_group)
    update_session_auth_hash(request, request.user)
    audit(request, "merchant.password.changed", "User", request.user.pk)
    return JsonResponse({"ok": True})

@restricted_access
def alterar_minha_senha(request):
    if request.method == "POST":
        atual = request.POST.get("current_password", "")
        nova = request.POST.get("new_password", "")
        confirmacao = request.POST.get("confirm_password", "")
        if not request.user.check_password(atual):
            messages.error(request, "A senha atual está incorreta.")
        elif nova != confirmacao:
            messages.error(request, "A confirmação da nova senha não coincide.")
        else:
            try:
                validate_password(nova, user=request.user)
            except ValidationError as exc:
                messages.error(request, " ".join(exc.messages))
            else:
                request.user.set_password(nova)
                request.user.save(update_fields=["password"])
                profile = get_profile(request.user)
                if profile:
                    profile.must_change_password = False
                    profile.save(update_fields=["must_change_password", "updated_at"])
                update_session_auth_hash(request, request.user)
                audit(request, "password.changed", "User", request.user.pk)
                messages.success(request, "Senha alterada com sucesso.")
                return redirect("area_restrita")
    return render(request, "restrito/alterar_senha.html")


def erro_404(request, exception):
    return render(request, "errors/404.html", status=404)


def erro_403(request, exception):
    return render(request, "errors/403.html", status=403)


def health(request):
    return JsonResponse({"status": "ok", "service": "promoinfo"})


def serve_frontend_asset(request, asset_path: str):
    candidate = (STATIC_SOURCE_DIR / asset_path).resolve()
    try:
        candidate.relative_to(STATIC_SOURCE_DIR)
    except ValueError as exc:
        raise Http404("Arquivo inválido.") from exc
    if not candidate.is_file():
        raise Http404("Arquivo não encontrado.")
    content_type, encoding = mimetypes.guess_type(candidate.name)
    response = FileResponse(candidate.open("rb"), content_type=content_type or "application/octet-stream")
    if encoding:
        response["Content-Encoding"] = encoding
    response["Cache-Control"] = "no-cache" if settings.DEBUG else "public, max-age=86400"
    return response
