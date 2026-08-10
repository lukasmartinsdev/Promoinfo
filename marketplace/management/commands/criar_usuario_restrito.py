import os
import secrets

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from marketplace.models import UserProfile


class Command(BaseCommand):
    help = "Cria o administrador inicial da área restrita quando necessário."

    def handle(self, *args, **options):
        username = os.getenv("PROMOINFO_RESTRICTED_USERNAME", "admin").strip() or "admin"
        email = os.getenv("PROMOINFO_RESTRICTED_EMAIL", "").strip()
        configured_password = os.getenv("PROMOINFO_RESTRICTED_PASSWORD", "").strip()

        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )

        changed = False
        for field in ("is_staff", "is_superuser", "is_active"):
            if not getattr(user, field):
                setattr(user, field, True)
                changed = True

        if email and not user.email:
            user.email = email
            changed = True

        generated_password = None
        if created:
            password = configured_password or secrets.token_urlsafe(16)
            user.set_password(password)
            generated_password = None if configured_password else password
            changed = True

        if changed:
            user.save()

        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={"role": UserProfile.MASTER},
        )
        if profile.role != UserProfile.MASTER:
            profile.role = UserProfile.MASTER
            profile.save(update_fields=["role", "updated_at"])

        self.stdout.write(self.style.SUCCESS(f"Administrador pronto: {username}"))
        if generated_password:
            self.stdout.write(self.style.WARNING("Credencial inicial gerada:"))
            self.stdout.write(generated_password)
