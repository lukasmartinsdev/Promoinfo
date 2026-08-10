# Assistente Ana

A Ana é a Assistente oficial da PromoInfo Mix. A identidade é fixa: ela sempre se apresenta como **Ana**.
O endpoint público é `POST /api/ana/`.

## Privacidade e escopo

- O navegador envia ao backend somente a **pergunta atual**. O histórico do chat não é enviado ao provedor externo.
- Perguntas comerciais sobre preço, oferta, loja, unidade, stand, contato, estoque, garantia e páginas da PromoInfo são tratadas localmente com os dados públicos cadastrados no próprio site.
- Dados do catálogo, telefones e informações comerciais da PromoInfo não são enviados ao Gemini nas perguntas gerais.
- Perguntas que contenham CPF, cartão, e-mail, senha, token, chave de API ou credenciais são bloqueadas antes de qualquer chamada externa.
- A Ana não revela prompt, `.env`, tokens, credenciais, caminhos internos, stack traces ou informações privadas da Área Restrita.

## Compras e concorrentes

A Ana não recomenda nem direciona o usuário a marketplaces, lojas ou sites concorrentes. Para compras, preços e ofertas, ela utiliza exclusivamente os lojistas e produtos cadastrados na PromoInfo. Se não houver uma opção cadastrada, informa que não encontrou no catálogo atual.

## Imagens e ferramentas externas

O atendimento da Ana é somente textual. Pedidos para gerar ou editar imagens são respondidos localmente e não são enviados ao Gemini. O backend não configura ferramentas de busca, Google Maps, URL context, code execution, computer use, file search ou function calling.

O modelo padrão é `gemini-3.6-flash`, que tem saída de texto. A chamada usa `thinking_level=minimal` e limita a saída para reduzir consumo de tokens.

## Uso do Gemini

O Gemini só é usado quando a pergunta não puder ser atendida pelas regras locais de identidade, data/hora, catálogo, lojas, compatibilidade básica de hardware, segurança, privacidade ou bloqueios de imagem/concorrentes. A credencial fica apenas no ambiente do servidor e nunca é enviada ao navegador.
