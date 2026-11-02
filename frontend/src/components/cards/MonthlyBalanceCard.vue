<template>
  <CardBase title="Saldo do mês">
    <span :class="balanceClass">{{ formatCurrency(balanceInCents) }}</span>

    <template #footer>
      <!--
        A composição fica visível de propósito: o saldo é o DISPONÍVEL, e
        entender de onde ele vem exige ver as parcelas.

        Compras no crédito ficam de fora: não mexem neste número até a fatura
        ser paga, e o card de Faturas já mostra quanto está acumulado no
        cartão. Repetir o valor aqui com uma nota dizendo que ele não conta era
        mais ruído do que informação.
      -->
      <dl class="balance__lines">
        <div v-for="line in lines" :key="line.label" class="balance__line">
          <dt>{{ line.label }}</dt>
          <dd class="balance__amount" :class="`balance__amount--${line.tone}`">
            {{ line.sign }} {{ formatCurrency(line.value) }}
          </dd>
        </div>
      </dl>

      <p v-if="showNetResult" class="balance__net">
        Receitas menos despesas do mês:
        <span class="balance__netValue">{{ formatCurrency(netResult) }}</span>
      </p>
    </template>
  </CardBase>
</template>

<script setup>
import { computed } from "vue";
import { getMonthlyBalance } from "@/services/api";
import { useCardFetch } from "@/services/useCardFetch";
import { useFormatters } from "@/services/useFormatters";
import CardBase from "./CardBase.vue";

const props = defineProps({ year: Number, month: Number });

const { formatCurrency } = useFormatters();

const EMPTY = {
  balanceInCents: 0,
  previousBalanceInCents: 0,
  netResultInCents: 0,
  incomeInCents: 0,
  expenseInCents: 0,
  debitExpenseInCents: 0,
  creditExpenseInCents: 0,
  savedInCents: 0,
  withdrawnInCents: 0,
  invoicePaidInCents: 0,
};

// `null` como campo: este card precisa da resposta inteira, não de um número.
const { data: summary, refetch } = useCardFetch(props, getMonthlyBalance, null, EMPTY);

const field = (name) => computed(() => summary.value?.[name] ?? 0);

const balanceInCents = field("balanceInCents");
const netResult = field("netResultInCents");

/**
 * Só as linhas que realmente têm valor entram, para o card não virar uma
 * tabela de zeros na maioria dos meses.
 *
 * O saldo anterior abre a lista: o total exibido em cima é acumulado, então
 * sem essa linha a composição não fecharia — o leitor somaria receitas menos
 * despesas e chegaria a um número diferente do que está no topo do card.
 *
 * MIGRAÇÃO (ROADMAP 1.4) — aqui a cor é INFORMAÇÃO, não decoração: ela diz a
 * natureza da linha, e o sinal (+/−) diz a direção. As classes Tailwind
 * viraram `tone`, resolvido em CSS por token:
 *
 *   antes                  depois                        por quê
 *   text-emerald-600  ->   --feedback-success (green-600) entrada de dinheiro
 *   text-red-500      ->   --feedback-danger  (red-500)   saída de dinheiro
 *   text-blue-500     ->   --violet-600                   vai para a reserva
 *   text-sky-600      ->   --sky-600                      volta da reserva
 *   text-amber-600    ->   --feedback-warning (orange-600) fatura do cartão
 *
 * O único que troca de família é "Guardado": azul era vizinho do cobalt, e no
 * sistema novo cobalt significa ação e foco. Violeta é cor de sinal da
 * própria paleta (`--violet-*`) e mantém "Guardado" distinguível de
 * "Resgatado", que continua azul-céu — os dois movem a reserva, em direções
 * opostas.
 */
const lines = computed(() => {
  const s = summary.value ?? EMPTY;

  const movement = [
    { label: "Receitas", value: s.incomeInCents, sign: "+", tone: "in" },
    { label: "Despesas no débito", value: s.debitExpenseInCents, sign: "−", tone: "out" },
    { label: "Guardado", value: s.savedInCents, sign: "−", tone: "saved" },
    { label: "Resgatado", value: s.withdrawnInCents, sign: "+", tone: "withdrawn" },
    { label: "Fatura paga", value: s.invoicePaidInCents, sign: "−", tone: "invoice" },
  ].filter((line, index) => index === 0 || line.value > 0);

  const previous = s.previousBalanceInCents ?? 0;
  if (previous === 0) return movement;

  return [
    {
      label: "Saldo anterior",
      // O valor vai em módulo porque o sinal é exibido à parte. Saldo anterior
      // negativo é possível: basta o mês passado ter fechado no vermelho.
      value: Math.abs(previous),
      sign: previous > 0 ? "+" : "−",
      tone: previous > 0 ? "in" : "out",
    },
    ...movement,
  ];
});

/** Só faz sentido mostrar quando difere do saldo. */
const showNetResult = computed(() => netResult.value !== balanceInCents.value);

/**
 * BUG CORRIGIDO (M12): a versão anterior descobria o sinal do saldo fazendo
 * parse reverso da string já formatada. O número puro sempre esteve na resposta.
 *
 * MIGRAÇÃO: `text-green-600`/`text-red-500` viraram os mesmos dois sinais da
 * composição — verde de entrada para saldo positivo, vermelho de saída para
 * negativo.
 */
const balanceClass = computed(() =>
  balanceInCents.value >= 0 ? "balance__total--in" : "balance__total--out"
);

defineExpose({ refetch });
</script>

<style scoped>
.balance__total--in {
	color: var(--feedback-success);
}
.balance__total--out {
	color: var(--feedback-danger);
}

.balance__lines {
	display: flex;
	flex-direction: column;
	gap: var(--space-0-5);
	margin: 0;
	font: var(--type-caption);
	color: var(--text-secondary);
}
.balance__line {
	display: flex;
	justify-content: space-between;
	gap: var(--space-3);
}
.balance__line dt,
.balance__line dd {
	margin: 0;
}

.balance__amount {
	font-weight: var(--fw-medium);
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}
/* Cor que comunica — ver o comentário em `lines`. */
.balance__amount--in {
	color: var(--feedback-success);
}
.balance__amount--out {
	color: var(--feedback-danger);
}
.balance__amount--saved {
	color: var(--violet-600);
}
.balance__amount--withdrawn {
	color: var(--sky-600);
}
.balance__amount--invoice {
	color: var(--feedback-warning);
}

.balance__net {
	margin: var(--space-1-5) 0 0;
	padding-top: var(--space-1-5);
	border-top: 1px solid var(--border-subtle);
	font: var(--type-caption);
	color: var(--text-tertiary);
}
.balance__netValue {
	font-weight: var(--fw-medium);
	color: var(--text-secondary);
	font-variant-numeric: tabular-nums;
}
</style>
