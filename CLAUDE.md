# Gestão App — convenções do projeto

App de finanças pessoais. Backend Node/Express 5 + Mongoose 9 + Zod; frontend Vue 3
(`<script setup>`) + Vite + Tailwind 4. MongoDB Atlas.

## Comandos

```bash
cd backend && npm test          # 158 testes, MongoDB em memória, sem mocks
cd backend && npm run lint:check
cd frontend && npm run build
```

## Regras que não se negociam

**Dinheiro é inteiro, em centavos.** Todo campo monetário tem o sufixo `InCents`.
A conversão para reais acontece só na exibição, em `frontend/src/services/useFormatters.js`.
Ponto flutuante em dinheiro é bug.

**Datas são sempre UTC.** Gravadas em `00:00:00.000Z`; intervalos de mês saem de
`backend/src/utils/date.js`. Calcular no fuso local joga todo dia 1º para o mês anterior.

**A fatura é nomeada pelo mês do VENCIMENTO.** Num cartão que fecha dia 01 e vence
dia 05, as compras de setembro ficam na "fatura de outubro". Ver
`backend/src/utils/invoiceCycle.js`. Já causou dois bugs: confirme sempre contra
`cycleForMonth` antes de assumir qualquer coisa sobre mês de fatura.

**Toda compra `credit` exige `bankCard`.** Sem o vínculo ela não entra em fatura
nenhuma e some da tela sem erro.

**No frontend, importe de `services/api.js` por nome.** Com `import * as api`, uma
função ausente vira `undefined` em tempo de execução e o build não acusa nada.

**Rotas nascem protegidas.** `authenticate` é aplicado no nível do `app.js`.

**Erros têm um caminho só.** Controllers lançam `AppError`; `errorHandler` traduz
para HTTP. O frontend recebe `ApiError` com `displayMessage`.

## Testes

MongoDB real em memória (`mongodb-memory-server`), sem mocks. Não use datas fixas
que envelhecem: ancore em datas relativas a hoje, ou o teste quebra sozinho com o
tempo.

## Commits

Conventional Commits, mensagem em português, corpo explicando o **porquê**.
**Nunca adicionar `Co-Authored-By`** — a autoria é só do Luan.

## Banco

O `.env` local aponta para produção, com dados de usuários reais. Nenhum script
de migração ou seed roda contra ele sem autorização explícita.
