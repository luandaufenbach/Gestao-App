<template>
  <div class="plans">
    <header class="plans__head">
      <h1 class="plans__title">Plano</h1>
      <p class="plans__subtitle">
        Grátis é o presente; pago é o futuro e o passado. Lançar, categorizar, cartões e metas nunca
        deixam de ser gratuitos.
      </p>
    </header>

    <p v-if="loading && !state" class="plans__state">Carregando...</p>

    <template v-else>
      <GaNote v-if="hasPaidAccess" tone="success" icon="check">
        Plano Pro ativo até {{ formatDate(validUntil) }}.
        <template v-if="status === 'canceled'">
          A renovação foi cancelada, e o acesso vale até essa data.
        </template>
      </GaNote>

      <GaNote v-else-if="isAwaitingPayment" tone="warning" icon="clock">
        Cobrança criada e ainda não paga. O acesso abre assim que o Pix for compensado — costuma
        levar poucos minutos.
      </GaNote>

      <!-- Comparação antes do preço: quem não entende o que ganha não assina. -->
      <section class="plans__grid">
        <article class="plans__card">
          <span class="plans__label">Grátis</span>
          <p class="plans__price">R$ 0</p>
          <p class="plans__cardSub">Para sempre, sem cartão.</p>
        </article>

        <article class="plans__card plans__card--pro">
          <span class="plans__ribbon">Mais completo</span>
          <span class="plans__label plans__label--pro">{{ catalog?.name ?? "Pro" }}</span>
          <p class="plans__price">
            {{ priceLabel }}
            <span class="plans__per">por mês</span>
          </p>
          <p class="plans__cardSub">{{ yearLabel }}</p>

          <GaButton
            v-if="hasPaidAccess || isAwaitingPayment"
            variant="secondary"
            block
            :disabled="busy"
            @click="askCancel"
          >
            Cancelar assinatura
          </GaButton>
          <GaButton v-else variant="primary" block @click="showForm = true">
            Assinar com Pix
          </GaButton>
        </article>
      </section>

      <!--
        Tabela de comparação.

        É uma `<table>` de verdade, e não uma grade de divs: são dados
        tabulares, e com `<th scope>` o leitor de tela anuncia "Relatórios,
        Grátis, não incluído" em vez de ler um check solto.

        No celular ela NÃO vira cartões empilhados: a comparação lado a lado é
        a razão de a tabela existir, e empilhada ela perde o sentido. O que
        encolhe são as colunas e a fonte.
      -->
      <section class="plans__compare">
        <h2 class="plans__compareTitle">O que muda entre os planos</h2>

        <table class="cmp">
          <thead>
            <tr>
              <th scope="col" class="cmp__feature">Recurso</th>
              <th scope="col">Grátis</th>
              <th scope="col" class="cmp__pro">{{ catalog?.name ?? "Pro" }}</th>
            </tr>
          </thead>

          <tbody>
            <template v-for="group in COMPARISON" :key="group.group">
              <tr class="cmp__groupRow">
                <th scope="colgroup" colspan="3" class="cmp__group">{{ group.group }}</th>
              </tr>

              <tr v-for="row in group.rows" :key="row.label">
                <th scope="row" class="cmp__feature">
                  <span class="cmp__featureName">
                    {{ row.label }}
                    <span v-if="row.soon" class="cmp__soon">em breve</span>
                  </span>
                  <span v-if="row.hint" class="cmp__hint">{{ row.hint }}</span>
                </th>

                <td :class="cellClass(row.free)">
                  <GaIcon :name="row.free ? 'check' : 'x'" :size="16" />
                  <span class="cmp__sr">{{ row.free ? "incluído" : "não incluído" }}</span>
                </td>

                <td :class="cellClass(row.pro)">
                  <GaIcon :name="row.pro ? 'check' : 'x'" :size="16" />
                  <span class="cmp__sr">{{ row.pro ? "incluído" : "não incluído" }}</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <!--
          Reversão de risco logo abaixo da tabela, que é onde a objeção aparece.
          Os três pontos são verificáveis no próprio app: o cancelamento é o
          botão acima, o Pix não guarda cartão e exportar/excluir é do grátis.
        -->
        <ul class="plans__reassure">
          <li>
            <GaIcon name="check" :size="15" />
            Cancela quando quiser, pelo próprio app — o acesso vale até o fim do período já pago.
          </li>
          <li>
            <GaIcon name="check" :size="15" />
            Pagamento por Pix. Nenhum cartão fica salvo conosco.
          </li>
          <li>
            <GaIcon name="check" :size="15" />
            Exportar e excluir seus dados continua no grátis, assinando ou não.
          </li>
        </ul>
      </section>

      <!--
        O CPF é exigência da API do provedor, não nossa. Dizer isso na tela
        evita a leitura de que estamos coletando documento por capricho.
      -->
      <section v-if="showForm && !hasPaidAccess" class="plans__form">
        <h2 class="plans__formTitle">Dados para a cobrança</h2>

        <GaField
          v-slot="{ id }"
          label="CPF ou CNPJ"
          :tone="formError ? 'error' : 'default'"
          :hint="
            formError || 'Exigido pelo Asaas para emitir a cobrança. Não fica guardado conosco.'
          "
        >
          <input
            :id="id"
            v-model="cpfCnpj"
            type="text"
            inputmode="numeric"
            placeholder="000.000.000-00"
            @keyup.enter="submit"
          />
        </GaField>

        <GaButton variant="primary" :disabled="busy" @click="submit">
          {{ busy ? "Gerando cobrança..." : "Gerar Pix" }}
        </GaButton>
      </section>

      <GaNote v-if="invoiceUrl" tone="info" icon="external-link">
        Cobrança criada.
        <a class="plans__link" :href="invoiceUrl" target="_blank" rel="noopener noreferrer">
          Abrir a página de pagamento
        </a>
        — o acesso abre sozinho quando o Pix for compensado.
      </GaNote>

      <p v-if="error" class="plans__state plans__state--error">{{ error }}</p>
    </template>

    <ConfirmDialog
      :open="confirmingCancel"
      :busy="busy"
      title="Cancelar assinatura"
      :message="cancelMessage"
      confirm-label="Cancelar assinatura"
      @confirm="doCancel"
      @cancel="confirmingCancel = false"
    />
  </div>
</template>

<script setup>
/**
 * Tela de planos (ROADMAP 2.2 e 2.3).
 *
 * É o destino do `PaywallNotice`: sem ela, a recusa de um recurso pago não
 * tinha para onde apontar e o paywall virava beco sem saída.
 *
 * O preço NÃO está escrito aqui. Vem de `catalog`, que o backend devolve a
 * partir de `config/plans.js` — número de preço em duas fontes diverge no dia
 * em que uma das duas muda, e quem descobre é o cliente.
 */
import { ref, computed, onMounted } from "vue";
import GaNote from "@/design-system/components/GaNote.vue";
import GaButton from "@/design-system/components/GaButton.vue";
import GaField from "@/design-system/components/GaField.vue";
import GaIcon from "@/design-system/components/GaIcon.vue";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import { useSubscription } from "../stores/subscription";
import { useFormatters } from "../services/useFormatters";

/**
 * Tabela de comparação.
 *
 * ── A regra que vale aqui ────────────────────────────────────────────────
 *
 * Nenhuma linha promete o que o app não faz. Quem assina e não encontra o
 * recurso pede o dinheiro de volta e não volta mais — o prejuízo é maior que
 * a assinatura ganha.
 *
 * Por isso a foto do cupom fiscal entra marcada com `soon: true`: ela está no
 * ROADMAP (3.1 a 3.3) e NÃO está implementada. A marca "em breve" aparece na
 * tela ao lado do nome, e a coluna Pro mostra o X, não o check. Quando o
 * recurso existir, é só virar `pro: true` e apagar o `soon`.
 *
 * Os agrupamentos existem porque uma lista corrida de 13 linhas não se lê: a
 * pessoa precisa ver que o bloco "o que já aconteceu" é todo grátis e que o
 * bloco "o que vai acontecer" é o que ela está comprando.
 */
const COMPARISON = [
  {
    group: "O dia a dia",
    rows: [
      {
        label: "Lançamentos sem limite",
        hint: "receita, despesa, débito e crédito",
        free: true,
        pro: true,
      },
      { label: "Categorias, cartões e metas", free: true, pro: true },
      { label: "Compras parceladas", hint: "cada parcela na fatura certa", free: true, pro: true },
      { label: "Dashboard do mês corrente", free: true, pro: true },
      { label: "Assinaturas detectadas no histórico", free: true, pro: true },
    ],
  },
  {
    group: "Faturas do cartão",
    rows: [
      { label: "Fatura do ciclo atual", free: true, pro: true },
      { label: "Faturas já fechadas", free: true, pro: true },
      {
        label: "Faturas de ciclos futuros",
        hint: "o que as parcelas já comprometeram",
        free: false,
        pro: true,
      },
    ],
  },
  {
    group: "Olhar para frente e para trás",
    rows: [
      {
        label: "Relatórios de 3 a 12 meses",
        hint: "evolução, categorias e variação mês a mês",
        free: false,
        pro: true,
      },
      {
        label: "Projeção de caixa",
        hint: "quanto sobra nos próximos meses",
        free: false,
        pro: true,
      },
      {
        label: "Importar compra por foto do cupom fiscal",
        hint: "lê o QR da NFC-e e lança sozinho",
        free: false,
        pro: false,
        soon: true,
      },
    ],
  },
  {
    group: "Seus dados",
    rows: [
      { label: "Exportar tudo em um arquivo", free: true, pro: true },
      { label: "Excluir a conta e os dados", free: true, pro: true },
    ],
  },
];

const cellClass = (included) => ["cmp__cell", included ? "cmp__cell--yes" : "cmp__cell--no"];

const { formatCurrency, formatDate } = useFormatters();
const {
  state,
  loading,
  error,
  hasPaidAccess,
  status,
  validUntil,
  catalog,
  isAwaitingPayment,
  load,
  subscribe,
  cancel,
} = useSubscription();

const showForm = ref(false);
const cpfCnpj = ref("");
const formError = ref("");
const busy = ref(false);
const invoiceUrl = ref("");
const confirmingCancel = ref(false);

onMounted(() => load({ force: true }).catch(() => {}));

const priceLabel = computed(() =>
  catalog.value?.priceInCents ? formatCurrency(catalog.value.priceInCents) : "—"
);

/**
 * Âncora de preço: o mesmo valor dito no ano.
 *
 * É a única comparação que entra, e ela é ARITMÉTICA — sai do preço que o
 * backend devolve, multiplicado por doze. Nada de "menos que um café", que
 * inventa um preço de café, nem de desconto, contador ou número de assinantes,
 * que seriam números que não existem.
 */
const yearLabel = computed(() => {
  const cents = catalog.value?.priceInCents;
  if (!cents) return "";
  return `${formatCurrency(cents * 12)} por ano, cobrados mês a mês`;
});

/**
 * O cancelamento preserva o período já pago, e a mensagem precisa dizer isso:
 * quem acha que perde o mês desiste de cancelar e pede estorno, o que é pior
 * para os dois lados.
 */
const cancelMessage = computed(() =>
  hasPaidAccess.value
    ? `Seu acesso continua até ${formatDate(validUntil.value)}. Depois disso, a conta volta ao plano grátis sem perder nenhum dado.`
    : "A cobrança em aberto deixa de existir. Nenhum dado é apagado."
);

async function submit() {
  formError.value = "";

  if (!cpfCnpj.value.trim()) {
    formError.value = "Informe o CPF ou CNPJ.";
    return;
  }

  busy.value = true;

  try {
    const charge = await subscribe(cpfCnpj.value);
    invoiceUrl.value = charge.invoiceUrl ?? "";
    showForm.value = false;
    cpfCnpj.value = "";
  } catch (err) {
    formError.value = err.displayMessage ?? "Não foi possível criar a cobrança.";
  } finally {
    busy.value = false;
  }
}

function askCancel() {
  confirmingCancel.value = true;
}

async function doCancel() {
  busy.value = true;

  try {
    await cancel();
    invoiceUrl.value = "";
    confirmingCancel.value = false;
  } catch (err) {
    formError.value = err.displayMessage ?? "Não foi possível cancelar.";
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.plans {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.plans__head {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.plans__title {
  font: var(--type-page-title);
  letter-spacing: var(--ls-heading);
}

.plans__subtitle {
  max-width: 60ch;
  font: var(--type-small);
  color: var(--text-secondary);
}

.plans__state {
  font: var(--type-small);
  color: var(--text-tertiary);
  text-align: center;
  padding: var(--space-6) 0;
}

.plans__state--error {
  color: var(--feedback-danger);
}

.plans__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

/* Duas colunas só quando cada card ainda tem largura para a lista respirar. */
@media (min-width: 720px) {
  .plans__grid {
    grid-template-columns: 1fr 1fr;
  }
}

.plans__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-6);
  background: var(--surface-raised);
  border: 1px solid var(--ink-100);
  border-radius: var(--radius-card);
}

/* A borda cobalt é o que diz qual dos dois é a oferta. O selo reforça. */
.plans__card--pro {
  position: relative;
  border-color: var(--cobalt-500);
  /* Anel de 1px por fora, para o card pago ganhar peso sem engordar a borda
     e desalinhar a altura dos dois. */
  box-shadow: 0 0 0 1px var(--cobalt-500);
}

.plans__ribbon {
  position: absolute;
  top: 0;
  right: var(--space-6);
  transform: translateY(-50%);
  padding: var(--space-1) var(--space-2-5);
  border-radius: var(--radius-pill);
  background: var(--cobalt-500);
  color: var(--text-on-brand);
  font: var(--type-micro);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  white-space: nowrap;
}

.plans__cardSub {
  font: var(--type-small);
  color: var(--text-tertiary);
  /* Empurra o botão para a base, para os dois cards terminarem alinhados. */
  margin-block-end: auto;
}

.plans__label {
  font: var(--type-label);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.plans__label--pro {
  color: var(--cobalt-500);
}

.plans__price {
  font: var(--type-stat);
  color: var(--text-primary);
}

.plans__per {
  font: var(--type-small);
  color: var(--text-tertiary);
}

.plans__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-block-end: var(--space-2);
}

.plans__list li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font: var(--type-body);
  color: var(--text-secondary);
}

.plans__list svg {
  color: var(--feedback-success);
  flex-shrink: 0;
}

/* ── Tabela de comparação ──────────────────────────────────────────────── */
.plans__compare {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--card-pad);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
  /* A tabela tem largura mínima própria; sem isto ela alarga a tela. */
  min-width: 0;
}

.plans__compareTitle {
  font: var(--type-title);
  letter-spacing: var(--ls-title);
}

.cmp {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

/*
 * O cabeçalho gruda ao rolar: numa tabela de 13 linhas, quem chega ao fim já
 * não lembra qual coluna é a paga, e a decisão depende exatamente disso.
 */
.cmp thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: var(--space-2) var(--space-2);
  background: var(--surface-card);
  border-block-end: 1px solid var(--border-default);
  font: var(--type-label);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  color: var(--text-tertiary);
  text-align: center;
}
.cmp thead th.cmp__feature {
  text-align: left;
}
.cmp thead th.cmp__pro {
  color: var(--brand-primary);
}

.cmp__group {
  padding: var(--space-4) var(--space-2) var(--space-1-5);
  font: var(--type-label);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  color: var(--text-tertiary);
  text-align: left;
}

.cmp tbody tr:not(.cmp__groupRow) {
  border-block-start: 1px solid var(--border-subtle);
}

/*
 * A célula continua `table-cell`. Tentei `display:flex` aqui para empilhar
 * nome e dica: isso tira o `<th>` do algoritmo de tabela e a linha inteira
 * desalinha das colunas de check. Quem empilha são os filhos, em bloco.
 */
.cmp__feature {
  padding: var(--space-2-5) var(--space-2);
  font: var(--type-body);
  font-weight: var(--fw-regular);
  color: var(--text-primary);
  vertical-align: middle;
}

.cmp__featureName {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.cmp__hint {
  display: block;
  margin-block-start: 2px;
  font: var(--type-caption);
  color: var(--text-tertiary);
}

/* "em breve" é a única marca de recurso não entregue. Ver o COMPARISON. */
.cmp__soon {
  padding: 1px var(--space-1-5);
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--text-primary);
  font: var(--type-micro);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  white-space: nowrap;
}

.cmp__cell {
  width: 22%;
  padding: var(--space-2-5) var(--space-2);
  text-align: center;
  vertical-align: middle;
}
.cmp__cell svg {
  display: inline-block;
  vertical-align: middle;
}
.cmp__cell--yes svg {
  color: var(--feedback-success);
}
/* O X é cinza, e não vermelho: ausência de recurso não é erro, e vermelho em
   metade da coluna grátis faz a tela parecer uma punição. */
.cmp__cell--no svg {
  color: var(--text-disabled);
}

/* O texto do estado existe para o leitor de tela; o ícone sozinho não fala. */
.cmp__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/*
 * No celular a tabela encolhe, mas NÃO empilha: ver a comparação lado a lado
 * é a razão de ela existir.
 */
@media (max-width: 600px) {
  .cmp__feature {
    font: var(--type-small);
  }
  .cmp__cell {
    width: 64px;
    padding-inline: var(--space-1);
  }
  .cmp__hint {
    display: none;
  }
}

.plans__reassure {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-block-start: var(--space-2);
  border-block-start: 1px solid var(--border-subtle);
}
.plans__reassure li {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font: var(--type-small);
  color: var(--text-secondary);
}
.plans__reassure svg {
  flex-shrink: 0;
  margin-block-start: 2px;
  color: var(--feedback-success);
}

.plans__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--surface-raised);
  border: 1px solid var(--ink-100);
  border-radius: var(--radius-card);
}

.plans__formTitle {
  font: var(--type-title);
}

.plans__link {
  color: var(--text-link);
  text-decoration: underline;
}
</style>
