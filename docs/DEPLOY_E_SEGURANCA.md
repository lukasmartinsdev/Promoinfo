# Deploy e segurança

## Variáveis do ambiente de produção

Configure diretamente na hospedagem: `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `PROMOINFO_ASSISTANT_TOKEN`, `RECAPTCHA_SITE_KEY` e `RECAPTCHA_SECRET_KEY`. Ative cookies seguros e HTTPS no ambiente de produção.

Nenhum valor secreto deve ser gravado no repositório, em arquivos YAML versionados, no JavaScript ou no HTML. Sistemas de CI/CD devem referenciar secrets do próprio provedor, sem copiar o valor para o código.

## Publicação

Execute migrations, colete os arquivos estáticos e inicie o servidor Django pelo processo oferecido pela hospedagem. O navegador conversa apenas com os endpoints do backend da PromoInfo.
