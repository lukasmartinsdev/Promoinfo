# Deploy e segurança

## Variáveis do ambiente de produção

Configure diretamente na hospedagem: `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `PROMOINFO_ASSISTANT_TOKEN`, `PROMOINFO_ASSISTANT_MODEL`, `RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`, `RECAPTCHA_ALLOWED_HOSTNAMES` e as variáveis `PROMOINFO_DB_*`. Ative cookies seguros, redirecionamento HTTPS e HSTS no ambiente de produção.

O reCAPTCHA usa somente o par real informado pelo ambiente. As duas chaves são obrigatórias em conjunto e `RECAPTCHA_ALLOWED_HOSTNAMES` deve conter apenas os domínios públicos cadastrados no Google, como `promoinfo.vercel.app`. Não há fallback automático para chaves de teste.

Nenhum valor secreto deve ser gravado no repositório, em arquivos YAML versionados, no JavaScript ou no HTML. Sistemas de CI/CD devem referenciar secrets do próprio provedor, sem copiar o valor para o código.

## Publicação

Execute migrations, colete os arquivos estáticos e inicie o servidor Django pelo processo oferecido pela hospedagem. O navegador conversa apenas com os endpoints do backend da PromoInfo. Antes de promover o deploy, execute `python manage.py check --deploy`, `python manage.py test` e `python manage.py migrate --check`.
