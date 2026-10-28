# Caderno de Receitas

Webapp responsivo em português, sem PWA. Next.js 16 + React 19 + TypeScript, APIs Node.js, autenticação Neon Auth e Postgres no Neon. Publicação via GitHub → Vercel.

## Recursos

- Cadastro, entrada, saída, recuperação de senha e perfil.
- Receitas privadas por padrão, fotos, categorias, etiquetas e pastas.
- Ingredientes individuais ou colados em lote, medidas caseiras, modo de preparo e anotações privadas.
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

O catálogo inclui os 597 registros oficiais da TACO, com os IDs originais. Há 592 registros com energia e os quatro campos utilizados pelo cálculo (kcal, proteínas, carboidratos e gorduras); 450, 457, 458, 472 e 591 permanecem sem conjunto completo, com aviso. Duas referências complementares anteriores (leite e óleo de soja) continuam disponíveis para compatibilidade com receitas salvas. Novos cadastros de óleo de soja usam a referência TACO 272.

“Tr” (traços) contribui com zero. “NA” (não aplicável) contribui com zero apenas nos campos de energia/macros dos óleos puros e sais explicitamente listados no importador; isso não se aplica a sódio nem a valores ausentes. Asteriscos (análises em reavaliação) e análises não solicitadas nunca viram zero. Escolha o estado cru/cozido correspondente ao peso informado. Rótulos podem ser informados por 100 g. Os resultados são estimativas e não incluem automaticamente perdas de nutrientes, óleo descartado ou mudanças de rendimento.

Reimportação auditável: baixe o PDF oficial acima, execute `pdftotext -layout taco.pdf taco.txt` e `python scripts/import-taco.py taco.txt`. O script exige todos os 597 IDs e trata separadamente as lacunas da fonte. Os 563 conjuntos de nutrientes já existentes foram comparados ao PDF e preservados.

A busca aceita nomes comuns, plurais, ordem de palavras, cortes como “picado” e pequenos erros de digitação. Apenas correspondências exatas normalizadas e sinônimos curados são automáticos. Arroz genérico, marcas e preparos não equivalentes exigem escolha. Sugestões não substituem automaticamente o ingrediente. Vegetais comuns sem preparo usam referência crua conforme indicado no formulário; a referência fica sempre visível e pode ser trocada. A exploração do catálogo tem paginação. Receitas antigas não são migradas: o editor permite reconhecer pendências e salvar após conferência.

## Limites iniciais e operação

Até 500 receitas e 100 fotos por usuário, fotos otimizadas WebP de até 500 KB no Postgres; listas exibem até 200 receitas. Esses limites preservam recursos na versão inicial. Para grande volume, migrar fotos para object storage e adicionar paginação. Denúncias são armazenadas na tabela `reports` para revisão administrativa; não há moderação automática nem painel administrativo. Recuperação de senha depende do serviço de e-mail do Neon Auth.

APIs validam sessão e propriedade dos dados; anotações, pastas e histórico de preparos permanecem privados. Não há service worker, manifest de instalação ou modo offline.

### Catálogo complementar: sal comum
Sal de cozinha (ID 10003), energia/macros por 100 g e medidas (chá 6 g; sopa 18 g; xícara 233,6 g) conferidos em https://tabnut.dis.epm.br/alimento/02047/sal-cozinha (TABNUT/UNIFESP, USDA 02047). Zero energia/macros não significa ausência de sódio. O catálogo é distribuído com a aplicação, sem depender de consultas externas a cada tecla. A TACO oficial é reproduzida com atribuição; complementos identificam a fonte. Ingredientes sem referência podem ser salvos com estimativa parcial.
