# Integração atual e próxima etapa do Supabase

O PostgreSQL do Supabase já armazena autenticação Django, perfis, funcionários, auditoria e tentativas de login. A conexão de produção usa SSL e configuração compatível com execução serverless.

O catálogo editorial permanece estático e o fluxo de cadastro de lojistas ainda usa armazenamento local do navegador. Uma próxima etapa deverá substituir esse trecho por:

- Supabase Auth para usuários, administradores e lojistas;
- PostgreSQL do Supabase para produtos, ofertas, lojas, marcas e permissões de lojistas;
- Supabase Storage para imagens e logos;
- regras de acesso com Row Level Security;
- sincronização com o frontend atual sem alteração visual.

Essa ampliação exige definir o fluxo de moderação, a política de retenção de documentos de lojistas e a estratégia de armazenamento de imagens antes da migração dos dados locais.
