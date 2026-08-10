# PromoInfo Django V19

Versão consolidada do marketplace PromoInfo Mix em Django, com a Ana, área restrita, cadastro de funcionários e validação matemática de CPF.

## Abrir no VS Code

Abra a pasta `PromoInfo_Django_V19` no VS Code e use o PowerShell integrado.

Na primeira execução:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py check
```

O projeto não inclui inicializador automático `.cmd`, `.bat` ou `.ps1` para abrir o sistema.

Nenhuma chave real do Gemini é incluída no ZIP. O `.env` continua ignorado pelo Git. Para desenvolvimento local, copie seu `.env` já configurado ou crie um a partir de `.env.example`.

Para iniciar o servidor:

```powershell
.\.venv\Scripts\Activate.ps1
python manage.py runserver 127.0.0.1:8765
```

Depois acesse `http://127.0.0.1:8765/` no navegador.

## V19

A V19 consolida:

- proteções da Ana e matriz adversarial da V18;
- identidade fixa como Ana, Assistente PromoInfo Mix;
- bloqueio local de pedidos de geração/edição de imagem;
- bloqueio de exfiltração de dados sensíveis e configurações internas;
- bloqueio de recomendações comerciais para marketplaces concorrentes;
- tratamento local de consultas comerciais da PromoInfo;
- integração textual com Gemini para conhecimento geral quando a chave estiver configurada;
- correção do ambiente local de reCAPTCHA;
- correção do teste de login da área restrita com `testserver`;
- cadastro de funcionários com CPF matematicamente validado antes da gravação.

## Testes manuais/qualidade

No PowerShell, dentro da pasta do projeto:

```powershell
.\.venv\Scripts\Activate.ps1
python manage.py test
python tools\audit_ana_questions.py
python tools\check_secrets.py
python tools\check_frontend.py
python manage.py check
```

## Estrutura

- `marketplace/`: regras de negócio, views, modelos e serviço da Ana;
- `promoinfo/`: configuração Django;
- `templates/`: páginas HTML;
- `static/`: estilos, scripts, imagens e dados públicos;
- `tools/`: verificações de qualidade e segurança;
- `docs/`: documentação técnica.
