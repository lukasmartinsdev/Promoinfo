from __future__ import annotations

import json

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.http import HttpRequest, JsonResponse

from .decorators import get_profile
from .models import AuditEvent, Funcionario
from .security import client_ip
from .validators import limpar_cpf, validar_cpf


EMPLOYEE_FIELDS = ("nome", "cpf", "cargo")


def _serialize_employee(employee: Funcionario) -> dict:
    return {
        "id": employee.pk,
        "nome": employee.nome,
        "cpf": employee.cpf,
        "cargo": employee.cargo,
        "created_at": employee.created_at.isoformat(),
        "updated_at": employee.updated_at.isoformat(),
        "created_by_id": employee.created_by_id,
    }


def _error(message: str, status: int, *, fields: dict | None = None) -> JsonResponse:
    payload = {"ok": False, "error": message}
    if fields:
        payload["fields"] = fields
    return JsonResponse(payload, status=status)


def _method_not_allowed(*allowed_methods: str) -> JsonResponse:
    response = _error("Método HTTP não permitido.", 405)
    response["Allow"] = ", ".join(allowed_methods)
    return response


def _authorize(request: HttpRequest, capability: str) -> JsonResponse | None:
    if not request.user.is_authenticated or not request.user.is_active:
        return _error("Autenticação necessária.", 401)

    profile = get_profile(request.user)
    if profile is None or not bool(getattr(profile, capability, False)):
        return _error("Você não possui permissão para executar esta ação.", 403)
    return None


def _read_json(request: HttpRequest) -> tuple[dict | None, JsonResponse | None]:
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None, _error("JSON inválido.", 400)
    if not isinstance(payload, dict):
        return None, _error("O corpo JSON deve ser um objeto.", 400)
    return payload, None


def _validate_employee_payload(payload: dict) -> tuple[dict | None, JsonResponse | None]:
    fields = {}
    data = {}
    for field in EMPLOYEE_FIELDS:
        value = payload.get(field)
        if not isinstance(value, str) or not value.strip():
            fields[field] = "Este campo é obrigatório."
        else:
            data[field] = value.strip()

    if fields:
        return None, _error("Preencha todos os campos obrigatórios.", 400, fields=fields)

    data["cpf"] = limpar_cpf(data["cpf"])
    if not validar_cpf(data["cpf"]):
        return None, _error("CPF inválido.", 400, fields={"cpf": "CPF inválido."})
    return data, None


def _model_validation_error(exc: ValidationError) -> JsonResponse:
    if hasattr(exc, "message_dict"):
        fields = {
            field: " ".join(messages)
            for field, messages in exc.message_dict.items()
        }
    else:
        fields = {"dados": " ".join(exc.messages)}
    return _error("Dados do funcionário inválidos.", 400, fields=fields)


def _record_audit(request: HttpRequest, action: str, employee: Funcionario) -> None:
    AuditEvent.objects.create(
        actor=request.user,
        action=action,
        target_type="Funcionario",
        target_id=str(employee.pk),
        detail=f"API: {employee.nome}"[:500],
        ip_address=client_ip(request),
    )


def funcionarios_collection(request: HttpRequest) -> JsonResponse:
    if request.method == "GET":
        denied = _authorize(request, "can_view_employees")
        if denied:
            return denied
        employees = [_serialize_employee(employee) for employee in Funcionario.objects.all()]
        return JsonResponse({"ok": True, "count": len(employees), "funcionarios": employees})

    if request.method == "POST":
        denied = _authorize(request, "can_create_employees")
        if denied:
            return denied
        payload, error = _read_json(request)
        if error:
            return error
        data, error = _validate_employee_payload(payload)
        if error:
            return error

        if Funcionario.objects.filter(cpf=data["cpf"]).exists():
            return _error("Já existe um funcionário cadastrado com este CPF.", 409)

        try:
            with transaction.atomic():
                employee = Funcionario.objects.create(
                    nome=data["nome"],
                    cpf=data["cpf"],
                    cargo=data["cargo"],
                    created_by=request.user,
                )
                _record_audit(request, "employee.created", employee)
        except ValidationError as exc:
            return _model_validation_error(exc)
        except IntegrityError:
            return _error("Já existe um funcionário cadastrado com este CPF.", 409)

        return JsonResponse(
            {"ok": True, "funcionario": _serialize_employee(employee)},
            status=201,
        )

    return _method_not_allowed("GET", "POST")


def funcionario_detail(request: HttpRequest, funcionario_id: int) -> JsonResponse:
    if request.method == "GET":
        capability = "can_view_employees"
    elif request.method == "PUT":
        capability = "can_edit_employees"
    else:
        return _method_not_allowed("GET", "PUT")

    denied = _authorize(request, capability)
    if denied:
        return denied

    employee = Funcionario.objects.filter(pk=funcionario_id).first()
    if employee is None:
        return _error("Funcionário não encontrado.", 404)

    if request.method == "GET":
        return JsonResponse({"ok": True, "funcionario": _serialize_employee(employee)})

    payload, error = _read_json(request)
    if error:
        return error
    data, error = _validate_employee_payload(payload)
    if error:
        return error

    duplicate_cpf = (
        Funcionario.objects.filter(cpf=data["cpf"])
        .exclude(pk=employee.pk)
        .exists()
    )
    if duplicate_cpf:
        return _error("Já existe um funcionário cadastrado com este CPF.", 409)

    employee.nome = data["nome"]
    employee.cpf = data["cpf"]
    employee.cargo = data["cargo"]
    try:
        with transaction.atomic():
            employee.save()
            _record_audit(request, "employee.updated", employee)
    except ValidationError as exc:
        return _model_validation_error(exc)
    except IntegrityError:
        return _error("Já existe um funcionário cadastrado com este CPF.", 409)

    return JsonResponse({"ok": True, "funcionario": _serialize_employee(employee)})
