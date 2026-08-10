from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from .validators import limpar_cpf, validar_cpf


class Funcionario(models.Model):
    nome = models.CharField(max_length=150)
    cpf = models.CharField(max_length=11, unique=True)
    cargo = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="funcionarios_criados")

    class Meta:
        ordering = ["nome"]
        verbose_name = "Funcionário"
        verbose_name_plural = "Funcionários"

    def clean(self) -> None:
        self.cpf = limpar_cpf(self.cpf)
        if not validar_cpf(self.cpf):
            raise ValidationError({"cpf": "CPF inválido!"})

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.nome} — {self.cargo}"


class UserProfile(models.Model):
    MASTER = "master"
    RH = "rh"
    CADASTRO = "cadastro"
    CONSULTA = "consulta"
    ROLE_CHOICES = [
        (MASTER, "Administrador Master"),
        (RH, "RH"),
        (CADASTRO, "Cadastro"),
        (CONSULTA, "Consulta"),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="promoinfo_profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=CONSULTA)
    must_change_password = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def can_view_employees(self):
        return self.role in {self.MASTER, self.RH, self.CADASTRO, self.CONSULTA}

    @property
    def can_create_employees(self):
        return self.role in {self.MASTER, self.RH, self.CADASTRO}

    @property
    def can_edit_employees(self):
        return self.role in {self.MASTER, self.RH}

    @property
    def can_delete_employees(self):
        return self.role == self.MASTER

    @property
    def can_manage_users(self):
        return self.role == self.MASTER

    def __str__(self):
        return f"{self.user.username} — {self.get_role_display()}"


class AuditEvent(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=80)
    target_type = models.CharField(max_length=80, blank=True)
    target_id = models.CharField(max_length=80, blank=True)
    detail = models.CharField(max_length=500, blank=True)
    ip_address = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class LoginAttempt(models.Model):
    username_key = models.CharField(max_length=150, db_index=True)
    ip_address = models.CharField(max_length=64, db_index=True)
    success = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
