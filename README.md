# Caderno de Receitas

Webapp responsivo em português, sem PWA. Next.js 16 + React 19 + TypeScript, APIs Node.js, autenticação Neon Auth e Postgres no Neon. Publicação via GitHub → Vercel.

## Recursos

- Cadastro, entrada, saída, recuperação de senha e perfil.
- Receitas privadas por padrão, fotos, categorias, etiquetas e pastas.
- Ingredientes em gramas, modo de preparo e anotações privadas.
- Histórico de versões e diário privado de preparos com fotos e avaliação de sabor, textura e aparência.
- Comunidade: publicação, curtidas, comentários, receitas salvas, seguir, bloquear e adaptar com atribuição.
- Arquivar/restaurar receitas.
- Estimativas nutricionais totais, por porção e por 100 g após informar o peso final. Dados incompletos ficam identificados.

## Rodar

Node.js 24. `npm ci`. Copie `.env.example` para `.env.local` e configure os valores no ambiente, nunca no Git.

- `DATABASE_URL`: conexão Neon Postgres.
- `NEON_AUTH_BASE_URL`: endpoint Neon Auth da mesma branch.
- `NEON_AUTH_COOKIE_SECRET`: segredo aleatório com pelo menos 32 caracteres. Na ausência, o servidor deriva uma chave HMAC da credencial do banco; a rotação dessa credencial encerra as sessões locais.

Execute `npm run db:migrate` uma vez por banco/branch, depois `npm run dev`. A migração apenas cria tabelas e índices inexistentes. Faça backup e teste em branch separada antes de futuras mudanças estruturais.

Validação: `npm test`, `npm run typecheck`, `npm run build`.

## Vercel

Importe este repositório, use preset Next.js e configure as variáveis via integração Neon. Autorize o domínio de produção em Neon Auth → Trusted domains. A branch de preview precisa de schema e Auth configurados. Push para `main` publica a produção.

## Nutrição

Fonte: Tabela Brasileira de Composição de Alimentos (TACO), NEPA/Unicamp, 4ª edição ampliada e revisada, 2011.
https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf

O catálogo contém 563 alimentos com os quatro valores disponíveis. “Tr” (traços) é tratado como zero; valores ausentes não são inventados. Escolha o estado cru/cozido correspondente ao peso informado. Quantidades em gramas da parte comestível. Rótulos podem ser informados manualmente por 100 g. Os resultados são estimativas e não incluem automaticamente perdas de nutrientes, óleo descartado ou mudanças de rendimento.

## Limites iniciais e operação

Até 500 receitas e 100 fotos por usuário, fotos otimizadas WebP de até 500 KB no Postgres; listas exibem até 200 receitas. Esses limites preservam recursos na versão inicial. Para grande volume, migrar fotos para object storage e adicionar paginação. Denúncias são armazenadas na tabela `reports` para revisão administrativa; não há moderação automática nem painel administrativo. Recuperação de senha depende do serviço de e-mail do Neon Auth.

APIs validam sessão e propriedade dos dados; anotações, pastas e histórico de preparos permanecem privados. Não há service worker, manifest de instalação ou modo offline.
