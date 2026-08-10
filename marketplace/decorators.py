from functools import wraps
from django.contrib import messages
from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import redirect


def get_profile(user):
    if not user.is_authenticated or not user.is_active:
        return None
    try:
        return user.promoinfo_profile
    except ObjectDoesNotExist:
        return None


def restricted_access(view):
    @wraps(view)
    def inner(request, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.is_active:
            return redirect(f"/area-restrita/entrar/?next={request.path}")
        if get_profile(request.user) is None:
            messages.error(request, "Seu usuário não possui perfil de acesso à área restrita.")
            return redirect("home")
        return view(request, *args, **kwargs)
    return inner


def require_capability(capability):
    def decorator(view):
        @wraps(view)
        @restricted_access
        def inner(request, *args, **kwargs):
            profile = get_profile(request.user)
            if not profile or not bool(getattr(profile, capability, False)):
                messages.error(request, "Você não possui permissão para executar esta ação.")
                return redirect("area_restrita")
            return view(request, *args, **kwargs)
        return inner
    return decorator
