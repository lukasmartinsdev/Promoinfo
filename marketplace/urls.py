from django.urls import path, re_path
from django.views.generic import RedirectView
from . import api_views, views

urlpatterns = [
    path("", views.render_page, {"page": "index"}, name="home"),
    path("api/status/", views.health, name="health"),
    path("api/ana/", views.assistant_chat, name="assistant_chat"),
    path("api/auth/challenge/", views.merchant_security_challenge, name="merchant_security_challenge"),
    path("api/funcionarios/", api_views.funcionarios_collection, name="api_funcionarios"),
    path(
        "api/funcionarios/<int:funcionario_id>/",
        api_views.funcionario_detail,
        name="api_funcionario_detail",
    ),
    path("area-restrita/entrar/", views.login_restrito, name="login_restrito"),
    path("area-restrita/sair/", views.logout_restrito, name="logout_restrito"),
    path("area-restrita/usuarios/", views.usuarios_permissoes, name="usuarios_permissoes"),
    path("area-restrita/usuarios/novo/", views.criar_usuario, name="criar_usuario"),
    path("area-restrita/usuarios/<int:user_id>/atualizar/", views.atualizar_usuario, name="atualizar_usuario"),
    path("area-restrita/seguranca/", views.seguranca_auditoria, name="seguranca_auditoria"),
    path("area-restrita/minha-senha/", views.alterar_minha_senha, name="alterar_minha_senha"),
    path("area-restrita/", views.area_restrita, name="area_restrita"),
    path("funcionarios/", views.listar_funcionarios, name="listar_funcionarios"),
    path("funcionarios/cadastrar/", views.cadastrar_funcionario, name="cadastrar_funcionario"),
    path("funcionarios/<int:funcionario_id>/editar/", views.editar_funcionario, name="editar_funcionario"),
    path("funcionarios/<int:funcionario_id>/excluir/", views.excluir_funcionario, name="excluir_funcionario"),
]

for page_name in views.PAGE_TEMPLATES:
    urlpatterns.extend([
        path(f"{page_name}.html", views.render_page, {"page": page_name}),
        path(f"{page_name}/", RedirectView.as_view(url="/" if page_name == "index" else f"/{page_name}.html", permanent=False)),
    ])

urlpatterns.append(re_path(r"^(?P<asset_path>(?:assets/.+|[^/]+\.(?:css|js|json|png|jpe?g|gif|webp|svg|ico|txt|woff2?|ttf|map)))$", views.serve_frontend_asset, name="frontend-asset"))
