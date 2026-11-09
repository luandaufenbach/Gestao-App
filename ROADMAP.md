# Roteiro

Ordem de implementação até o produto sustentar tráfego pago e assinatura.
Cada item traz o critério de aceite e o agente responsável.

As estimativas são grosseiras e servem para ordenar, não para prometer data.

---

## Estado atual

Marcação lida do código e do histórico de commits, não de um teste de aceite
rodado agora. Onde diz "falta configurar", o código está pronto e o que falta é
uma conta ou uma chave fora do repositório.

Atenção ao 0.2 e ao 0.3: o fluxo existe inteiro e tem teste, mas o envio real
nunca foi ligado. O `PONTO DE EXTENSÃO` em `backend/src/utils/mailer.js` espera
um provedor, e todo provedor sério exige domínio verificado para remeter — sem
isso o e-mail é recusado ou cai em spam. Ou seja, o aceite do 0.2, "usuário sem
acesso recupera a conta sozinho", **ainda não é verdade em produção**. É a única
coisa do roteiro que a compra do domínio destrava de fato.

| # | Item | Estado |
| - | ---- | ------ |
| 0.1 | Sair do plano gratuito do Render | **pendente** — painel do Render, não é código |
| 0.2 | Recuperação de senha por e-mail | código feito — **não envia e-mail ainda**: sem `MAIL_PROVIDER`, o `deliver` só escreve o link no console |
| 0.3 | Verificação de e-mail no cadastro | código feito — depende do mesmo envio que falta no 0.2 |
| 0.4 | Monitoramento de erro (Sentry) | feito — falta configurar `SENTRY_DSN` |
| 0.5 | Analytics de funil | feito — falta configurar `VITE_POSTHOG_KEY` |
| 0.6 | LGPD: exportar e excluir conta | feito |
| 0.7 | Termos de uso e política de privacidade | telas feitas — falta preencher os dados do responsável e a revisão jurídica |
| 0.8 | Zerar `npm audit` | feito — 0 críticas e 0 altas nos dois pacotes; sobram moderadas só em ferramenta de desenvolvimento |
| 1.1 | Projeção de caixa futura | feito |
| 1.2 | Relatórios de 3 a 12 meses | feito |
| 1.3 | Tokens, fontes e ícones do design system | feito |
| 1.4 | Telas migradas, uma a uma | quase lá — 26 dos 28 `.vue` já usam os tokens; faltam `ConfirmDialog.vue` e `TransactionFormFields.vue` |
| 2.1 | Planos e estado de assinatura no `User` | feito |
| 2.2 | Gateway de pagamento com Pix | **adiado de propósito** — exige conta verificada com CPF ou CNPJ, e não há usuário para cobrar ainda |
| 2.3 | Paywall por middleware | feito — desligado por `PAYWALL_ENABLED`, e fatura de ciclo futuro ainda não entra na regra |
| 2.4 | Teste grátis e expiração | **pendente** — depende do 2.2 |
| 3.x a 5.x | — | **pendente** |

### Como o trabalho é distribuído

O que pode correr em paralelo é o que não disputa arquivo. Hoje: 0.7, 0.8 e 1.2
são independentes entre si — 0.7 e 1.2 só se encostam no `frontend/src/router/index.js`,
onde cada um acrescenta uma rota.

O **1.4 já passou por quase todo o frontend** e por isso é ele que gera conflito,
não quem vier depois. Quem criar tela nova nasce direto nos tokens; quem
encostar num arquivo já migrado tem que escrever na linguagem nova, não em
Tailwind cru — foi o que aconteceu no `GoalsCard.vue`, onde a quebra do total
guardado chegou em Tailwind e teve que virar `.goals__totalSplit`.

A Fase 2 não começa antes de duas decisões que não são técnicas: qual gateway e
o que fica de graça.

---

## Fase 0 — Antes de gastar o primeiro real em anúncio

Nada aqui é funcionalidade. É o que impede a verba de anúncio de ser desperdiçada.

| # | Item | Aceite | Agente |
| - | ---- | ------ | ------ |
| 0.1 | Sair do plano gratuito do Render | Primeira requisição depois de horas parado responde em menos de 2s | — |
| 0.2 | Recuperação de senha por e-mail | Usuário sem acesso recupera a conta sozinho; token expira e é de uso único | `backend-api` + `seguranca-lgpd` |
| 0.3 | Verificação de e-mail no cadastro | Conta não verificada não acumula dados por mais de 7 dias | `backend-api` |
| 0.4 | Monitoramento de erro (Sentry) | Erro 500 em produção chega notificado com stack e usuário afetado | `backend-api` |
| 0.5 | Analytics de funil | Dá para responder: de 100 cliques no anúncio, quantos cadastram e quantos lançam a primeira transação | `frontend-vue` |
| 0.6 | LGPD: exportar e excluir conta | Usuário baixa os próprios dados em JSON e apaga a conta sem abrir chamado | `seguranca-lgpd` |
| 0.7 | Termos de uso e política de privacidade | Links acessíveis antes do cadastro | — |
| 0.8 | Zerar `npm audit` | 0 vulnerabilidades altas nos dois pacotes | `seguranca-lgpd` |

**O 0.1 vem primeiro.** Hoje a aplicação dorme e a primeira visita espera cerca de
50 segundos. Anúncio que cai em tela parada perde o visitante antes de qualquer
funcionalidade existir.

---

## Fase 1 — Valor visível antes do paywall

Precisa existir algo que justifique a cobrança no momento em que ela for ligada.

| # | Item | Aceite | Agente |
| - | ---- | ------ | ------ |
| 1.1 | Projeção de caixa futura | Tela mostra quanto já está comprometido nos próximos 6 meses, somando parcelas e faturas futuras | `backend-api` + `frontend-vue` |
| 1.2 | Relatórios de 3 a 12 meses | Evolução por mês, comparativo por categoria e variação mês a mês | `backend-api` + `frontend-vue` |

O 1.1 é o melhor retorno do roteiro inteiro: os dados **já existem** no banco. Uma
compra em 5x nasce como cinco transações datadas, e `invoiceCycle.js` já sabe em qual
fatura cada uma cai. Falta consulta e tela.

---

## Fase 1.5 — Design system

| # | Item | Aceite | Agente |
| - | ---- | ------ | ------ |
| 1.3 | Tokens, fontes e ícones do design system | Tokens CSS e fontes locais carregando; um componente base migrado | `design-system` |
| 1.4 | Telas migradas, uma a uma | Nenhuma tela mistura o visual antigo com o novo | `design-system` |

A skill `gestaoapp-design` está em `.claude/skills/gestaoapp-design/`. Os componentes
dela são React; o projeto é Vue — o trabalho é portar padrão, não copiar arquivo.

Não bloqueia a Fase 0: cold start, recuperação de senha e monitoramento valem mais que
aparência. Mas vale **antes** de ligar o paywall — a tela de pagamento é onde o visual
vira conversão ou desistência.

---

## Fase 2 — Monetização

| # | Item | Aceite | Agente |
| - | ---- | ------ | ------ |
| 2.1 | Planos e estado de assinatura no `User` | Campo de plano, status e validade, com índice | **feito** |
| 2.2 | Gateway de pagamento com Pix | Assinatura criada, renovada e cancelada; webhook idempotente | `backend-api` |
| 2.3 | Paywall por middleware | Recurso pago recusa com 402 e mensagem clara; recurso grátis continua aberto | **feito** — desligado até 2.2 e até a interface tratar o 402 |
| 2.4 | Teste grátis e expiração | Fim do teste não apaga dado nem trava a leitura do histórico | `backend-api` + `frontend-vue` |

No Brasil, Pix é obrigatório. Asaas e Mercado Pago atendem; cartão recorrente sozinho
reduz muito a conversão.

### O que fica grátis — decidido

**Grátis é o presente; pago é o futuro e o passado.**

| Grátis | Pago |
| ------ | ---- |
| Lançar transações, sem teto | Projeção de caixa (`GET /dashboard/projection`) |
| Categorias, cartões e metas | Relatórios de 3 a 12 meses (`GET /reports/monthly`) |
| Dashboard do mês corrente | Faturas de ciclos futuros |
| Fatura do ciclo atual | Leitura do cupom fiscal, quando existir (3.1) |

O raciocínio: o grátis entrega o hábito diário, que é o que prende; o pago entrega
a resposta que ninguém mais dá. A divisão também cai quase pronta no código — são
três endpoints distintos, não uma regra espalhada por controller.

**Nunca atrás do paywall**, aconteça o que acontecer com a assinatura: ler o próprio
histórico, exportar os dados e excluir a conta. Os dois últimos são direito do titular
pela LGPD (artigo 18), e cobrar por eles seria ilegal, não só feio. É o mesmo que o
aceite do 2.4 já exige.

O risco assumido: quem só quer anotar gasto nunca paga. É aceitável porque essa pessoa
não ia pagar em nenhum dos modelos, e de graça ela traz as outras.

---

## Fase 3 — O diferencial

| # | Item | Aceite | Agente |
| - | ---- | ------ | ------ |
| 3.1 | Leitura do QR code do cupom fiscal | Foto do cupom vira compra com itens separados, após confirmação do usuário | `fiscal-nfce` |
| 3.2 | Fallback por OCR | Cupom cuja chave não resolve ainda gera um rascunho editável | `fiscal-nfce` |
| 3.3 | Anti-duplicata por chave de acesso | A mesma nota lançada duas vezes é recusada | `fiscal-nfce` + `qa-testes` |
| 3.4 | Detecção de assinaturas recorrentes | App identifica cobranças mensais repetidas e mostra o total comprometido por mês | `backend-api` |

O 3.1 é a aposta. Ler a chave de acesso devolve a nota **item a item**: deixa de ser
"R$ 320 no mercado" e vira "R$ 47 em refrigerante no mês". Nenhum concorrente grande
faz isso hoje.

Risco a validar antes de construir: cada SEFAZ estadual tem portal próprio, não há API
federal única e gratuita, e raspagem quebra. **Faça uma prova de conceito com cupons
reais de um estado só antes de comprometer o roteiro.** Se a taxa de acerto não passar
de 80%, o recurso vira promessa quebrada e é melhor não vendê-lo.

---

## Fase 4 — Retenção

| # | Item | Aceite | Agente |
| - | ---- | ------ | ------ |
| 4.1 | PWA instalável | App instala na tela inicial e abre sem barra do navegador | `frontend-vue` |
| 4.2 | Notificações push | "Sua fatura fecha em 3 dias" chega no celular | `frontend-vue` + `backend-api` |
| 4.3 | Alertas proativos | Gasto acima da média e fatura prestes a fechar disparam aviso | `backend-api` |
| 4.4 | Conta compartilhada (casal) | Duas contas enxergam o mesmo conjunto de lançamentos, com autoria preservada | `backend-api` + `seguranca-lgpd` |

Push é mais barato que WhatsApp para aviso iniciado pelo app, que é o caso de 4.3.
WhatsApp só compensa para mensagem iniciada pelo usuário.

O 4.4 mexe no escopo por usuário, que hoje é a garantia de isolamento entre contas.
Exige revisão de segurança dedicada, não é só um campo novo.

---

## Fase 5 — Tier caro

| # | Item | Aceite | Agente |
| - | ---- | ------ | ------ |
| 5.1 | Open Finance (Pluggy ou Belvo) | Extrato sincroniza sozinho e concilia com lançamentos manuais | `backend-api` |

Custa por conexão ativa. Só faz sentido com assinatura já validada: é o recurso que
justifica o plano mais caro, não o que atrai o primeiro usuário.

---

## Ordem resumida

```
0.1 → 0.2 → 0.4 → 0.5 → 1.1 → 0.6 → 0.7 → 2.x → 3.1 → 3.4 → 4.x → 5.1
```

A projeção de caixa (1.1) entra antes da cobrança porque o paywall precisa ter o que
vender. O cupom fiscal (3.1) entra depois da cobrança porque é o recurso mais caro de
construir e o que mais pode falhar na validação.
