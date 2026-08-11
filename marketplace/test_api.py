import json

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from .models import AuditEvent, Funcionario, UserProfile


class FuncionarioApiTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.master = User.objects.create_user(
            username="api-master",
            password="senha-segura",
        )
        UserProfile.objects.create(user=self.master, role=UserProfile.MASTER)

        self.cadastro = User.objects.create_user(
            username="api-cadastro",
            password="senha-segura",
        )
        UserProfile.objects.create(user=self.cadastro, role=UserProfile.CADASTRO)

        self.consulta = User.objects.create_user(
            username="api-consulta",
            password="senha-segura",
        )
        UserProfile.objects.create(user=self.consulta, role=UserProfile.CONSULTA)

        self.employee = Funcionario.objects.create(
            nome="Funcionário Inicial",
            cpf="52998224725",
            cargo="Atendente",
            created_by=self.master,
        )
        self.collection_url = reverse("api_funcionarios")

    def request_json(self, method, url, payload):
        return getattr(self.client, method)(
            url,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_get_lista_exige_autenticacao(self):
        response = self.client.get(self.collection_url)

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["error"], "Autenticação necessária.")

    def test_get_lista_funcionarios_para_perfil_de_consulta(self):
        self.client.force_login(self.consulta)

        response = self.client.get(self.collection_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["funcionarios"][0]["cpf"], "52998224725")

    def test_get_consulta_funcionario_por_id(self):
        self.client.force_login(self.consulta)

        response = self.client.get(
            reverse("api_funcionario_detail", args=[self.employee.pk])
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["funcionario"]["id"], self.employee.pk)

    def test_get_funcionario_inexistente_retorna_404(self):
        self.client.force_login(self.consulta)

        response = self.client.get(reverse("api_funcionario_detail", args=[999999]))

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["error"], "Funcionário não encontrado.")

    def test_post_cadastra_funcionario_e_registra_auditoria(self):
        self.client.force_login(self.cadastro)

        response = self.request_json(
            "post",
            self.collection_url,
            {"nome": "Nova Pessoa", "cpf": "168.995.350-09", "cargo": "Analista"},
        )

        self.assertEqual(response.status_code, 201)
        employee = Funcionario.objects.get(cpf="16899535009")
        self.assertEqual(employee.created_by, self.cadastro)
        self.assertTrue(
            AuditEvent.objects.filter(
                actor=self.cadastro,
                action="employee.created",
                target_id=str(employee.pk),
            ).exists()
        )

    def test_post_sem_permissao_retorna_403(self):
        self.client.force_login(self.consulta)

        response = self.request_json(
            "post",
            self.collection_url,
            {"nome": "Nova Pessoa", "cpf": "16899535009", "cargo": "Analista"},
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Funcionario.objects.count(), 1)

    def test_post_trata_json_invalido_e_campos_obrigatorios(self):
        self.client.force_login(self.cadastro)

        invalid_json = self.client.post(
            self.collection_url,
            data="{json",
            content_type="application/json",
        )
        missing_field = self.request_json(
            "post",
            self.collection_url,
            {"nome": "Sem cargo", "cpf": "16899535009"},
        )

        self.assertEqual(invalid_json.status_code, 400)
        self.assertEqual(invalid_json.json()["error"], "JSON inválido.")
        self.assertEqual(missing_field.status_code, 400)
        self.assertIn("cargo", missing_field.json()["fields"])

    def test_post_trata_cpf_invalido_e_duplicado(self):
        self.client.force_login(self.cadastro)

        invalid = self.request_json(
            "post",
            self.collection_url,
            {"nome": "CPF Inválido", "cpf": "111.111.111-11", "cargo": "Analista"},
        )
        duplicate = self.request_json(
            "post",
            self.collection_url,
            {"nome": "CPF Duplicado", "cpf": "529.982.247-25", "cargo": "Analista"},
        )

        self.assertEqual(invalid.status_code, 400)
        self.assertEqual(duplicate.status_code, 409)

    def test_put_atualiza_funcionario_e_registra_auditoria(self):
        self.client.force_login(self.master)
        detail_url = reverse("api_funcionario_detail", args=[self.employee.pk])

        response = self.request_json(
            "put",
            detail_url,
            {"nome": "Nome Atualizado", "cpf": "529.982.247-25", "cargo": "Gerente"},
        )

        self.assertEqual(response.status_code, 200)
        self.employee.refresh_from_db()
        self.assertEqual(self.employee.nome, "Nome Atualizado")
        self.assertEqual(self.employee.cargo, "Gerente")
        self.assertTrue(
            AuditEvent.objects.filter(
                actor=self.master,
                action="employee.updated",
                target_id=str(self.employee.pk),
            ).exists()
        )

    def test_put_sem_permissao_retorna_403(self):
        self.client.force_login(self.cadastro)

        response = self.request_json(
            "put",
            reverse("api_funcionario_detail", args=[self.employee.pk]),
            {"nome": "Sem Permissão", "cpf": "52998224725", "cargo": "Gerente"},
        )

        self.assertEqual(response.status_code, 403)
        self.employee.refresh_from_db()
        self.assertEqual(self.employee.nome, "Funcionário Inicial")

    def test_put_trata_funcionario_inexistente_e_cpf_duplicado(self):
        self.client.force_login(self.master)
        Funcionario.objects.create(
            nome="Segundo Funcionário",
            cpf="16899535009",
            cargo="Vendedor",
            created_by=self.master,
        )

        not_found = self.request_json(
            "put",
            reverse("api_funcionario_detail", args=[999999]),
            {"nome": "Inexistente", "cpf": "52998224725", "cargo": "Gerente"},
        )
        duplicate = self.request_json(
            "put",
            reverse("api_funcionario_detail", args=[self.employee.pk]),
            {"nome": "Duplicado", "cpf": "16899535009", "cargo": "Gerente"},
        )

        self.assertEqual(not_found.status_code, 404)
        self.assertEqual(duplicate.status_code, 409)

    def test_metodos_nao_suportados_retornam_405(self):
        self.client.force_login(self.master)

        collection_response = self.client.delete(self.collection_url)
        detail_response = self.client.post(
            reverse("api_funcionario_detail", args=[self.employee.pk])
        )

        self.assertEqual(collection_response.status_code, 405)
        self.assertEqual(collection_response.headers["Allow"], "GET, POST")
        self.assertEqual(detail_response.status_code, 405)
        self.assertEqual(detail_response.headers["Allow"], "GET, PUT")
