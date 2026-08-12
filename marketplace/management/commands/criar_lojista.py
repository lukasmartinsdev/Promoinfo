import os
import secrets

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError

from marketplace.models import (
    MERCHANT_GROUP,
    MERCHANT_PASSWORD_CHANGE_GROUP,
    AuditEvent,
    UserProfile,
)


class Command(BaseCommand):
    help = "Cria uma conta de lojista autenticada pelo Django."

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            default=os.getenv("PROMOINFO_MERCHANT_EMAIL", "admin@promoinfo.local"),
        )
        parser.add_argument(
            "--username",
            default=os.getenv("PROMOINFO_MERCHANT_USERNAME", "lojista-admin"),
        )
        parser.add_argument(
            "--name",
            default=os.getenv("PROMOINFO_MERCHANT_NAME", "Administrador PromoInfo"),
        )
        parser.add_argument(
            "--password",
            default=os.getenv("PROMOINFO_MERCHANT_PASSWORD", ""),
        )
        parser.add_argument("--reset-password", action="store_true")

    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        username = options["username"].strip()
        display_name = options["name"].strip()[:150]
        configured_password = options["password"].strip()
        if not email or "@" not in email:
            raise CommandError("Informe um e-mail válido.")
        if not username:
            raise CommandError("Informe um nome de usuário válido.")

        User = get_user_model()
        user = User.objects.filter(email__iexact=email).first()
        created = user is None
        if created:
            if User.objects.filter(username__iexact=username).exists():
                raise CommandError("O nome de usuário informado já está em uso.")
            user = User(username=username, email=email, is_active=True)
        elif UserProfile.objects.filter(user=user).exists():
            raise CommandError(
                "Este e-mail pertence à Área Restrita e não pode virar lojista."
            )
        elif user.is_staff or user.is_superuser:
            raise CommandError(
                "Este e-mail pertence a uma conta administrativa existente."
            )

        user.email = email
        user.first_name = display_name
        user.is_active = True
        user.is_staff = False
        user.is_superuser = False

        generated_password = ""
        should_set_password = created or options["reset_password"]
        if should_set_password:
            password = configured_password or secrets.token_urlsafe(18)
            try:
                validate_password(password, user=user)
            except ValidationError as exc:
                raise CommandError(" ".join(exc.messages)) from exc
            user.set_password(password)
            if not configured_password:
                generated_password = password
        user.save()

        merchant_group, _ = Group.objects.get_or_create(name=MERCHANT_GROUP)
        pending_group, _ = Group.objects.get_or_create(
            name=MERCHANT_PASSWORD_CHANGE_GROUP
        )
        user.groups.add(merchant_group)
        if should_set_password:
            user.groups.add(pending_group)

        AuditEvent.objects.create(
            actor=user,
            action="merchant.account_created" if created else "merchant.account_updated",
            target_type="User",
            target_id=str(user.pk),
            detail=email,
        )
        self.stdout.write(self.style.SUCCESS(f"Lojista pronto: {email}"))
        if generated_password:
            self.stdout.write(self.style.WARNING("Senha provisória gerada:"))
            self.stdout.write(generated_password)
