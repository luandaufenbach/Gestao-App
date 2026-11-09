<template>
  <div class="recorrentes">
    <div class="recorrentes__head">
      <span class="recorrentes__label">Assinaturas</span>
      <span class="recorrentes__icon">
        <GaIcon name="refresh-cw" :size="16" />
      </span>
    </div>

    <p v-if="loading" class="recorrentes__vazio">Procurando...</p>

    <p v-else-if="error" class="recorrentes__erro">{{ error }}</p>

    <template v-else-if="ativas.length">
      <p class="recorrentes__total">{{ formatCurrency(monthlyTotalInCents) }}</p>
      <p class="recorrentes__dica">
        por mês, em {{ ativas.length }} {{ ativas.length === 1 ? "cobrança" : "cobranças" }} que se
        repetem
      </p>

      <ul class="recorrentes__lista">
        <li v-for="a in ativas" :key="a.description" class="recorrentes__item">
          <span class="recorrentes__nome">{{ a.description }}</span>
          <span class="recorrentes__valor">{{ formatCurrency(a.valueInCents) }}</span>
        </li>
      </ul>

      <!--
        A lista é inferida, não declarada em lugar nenhum. Dizer isso evita que
        o usuário trate como verdade absoluta uma conta que pode ter errado.
      -->
      <p class="recorrentes__nota">
        Detectadas pelo histórico: mesma descrição e valor parecido, em pelo menos três meses.
      </p>
    </template>

    <template v-else>
      <p class="recorrentes__vazio">Nenhuma cobrança repetida encontrada.</p>
      <p class="recorrentes__nota">
        Uma cobrança aparece aqui depois de se repetir por três meses, com valor parecido.
      </p>
    </template>

    <p v-if="encerradas.length" class="recorrentes__nota">
      {{ encerradas.length }} parou de cobrar e não entra no total.
    </p>
  </div>
</template>

<script setup>
/**
 * Assinaturas recorrentes (ROADMAP 3.4).
 *
 * Mostra quanto do mês já está comprometido com cobrança que se repete
 * sozinha — a que o usuário costuma esquecer que assinou.
 *
 * Não usa `useCardFetch` de propósito: aquele composable recarrega quando o
 * mês selecionado muda, e esta leitura não tem mês. A janela é fixa em 12
 * meses no backend, e a resposta é a mesma em janeiro ou em julho.
 *
 * As encerradas vêm na resposta e aparecem só como contagem: são úteis para o
 * usuário perceber que algo parou, mas somá-las no total inflaria o
 * comprometido do mês.
 */
import { ref, computed, onMounted } from "vue";
import GaIcon from "@/design-system/components/GaIcon.vue";
import { getRecurringCharges } from "@/services/api";
import { useFormatters } from "@/services/useFormatters";

const { formatCurrency } = useFormatters();

const subscriptions = ref([]);
const monthlyTotalInCents = ref(0);
const loading = ref(false);
const error = ref("");

const ativas = computed(() => subscriptions.value.filter((s) => s.active));
const encerradas = computed(() => subscriptions.value.filter((s) => !s.active));

async function refetch() {
  loading.value = true;
  error.value = "";

  try {
    const data = await getRecurringCharges();
    subscriptions.value = Array.isArray(data?.subscriptions) ? data.subscriptions : [];
    monthlyTotalInCents.value = data?.monthlyTotalInCents ?? 0;
  } catch (err) {
    error.value = err.displayMessage ?? "Erro ao carregar assinaturas";
    subscriptions.value = [];
    monthlyTotalInCents.value = 0;
  } finally {
    loading.value = false;
  }
}

onMounted(refetch);

// O dashboard chama isto depois de criar, editar ou excluir transação: um
// lançamento novo pode completar o terceiro mês de uma assinatura.
defineExpose({ refetch });
</script>

<style scoped>
.recorrentes {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	min-width: 0;
	padding: var(--card-pad);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-card);
	background: var(--surface-card);
	box-shadow: var(--shadow-xs);
	color: var(--text-primary);
}

.recorrentes__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-3);
}
.recorrentes__label {
	font: var(--type-label);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	color: var(--text-tertiary);
}
.recorrentes__icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	flex-shrink: 0;
	border-radius: var(--radius-sm);
	background: var(--brand-primary-soft);
	color: var(--brand-primary);
}

/* Mesmo tamanho dos outros números do dashboard: 24px, não os 32 do
   `--type-stat` cheio, que não cabe na coluna lateral. */
.recorrentes__total {
	margin: 0;
	font: var(--fw-medium) 24px / 1 var(--font-display);
	letter-spacing: -0.02em;
	font-variant-numeric: tabular-nums;
}
.recorrentes__dica {
	margin: 0;
	font: var(--type-small);
	color: var(--text-tertiary);
}

.recorrentes__lista {
	list-style: none;
	margin: var(--space-1) 0 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}
.recorrentes__item {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: var(--space-3);
	font: var(--type-small);
}
.recorrentes__nome {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: var(--text-secondary);
}
.recorrentes__valor {
	flex-shrink: 0;
	font-variant-numeric: tabular-nums;
	color: var(--text-primary);
}

.recorrentes__nota {
	margin: 0;
	font: var(--type-caption);
	color: var(--text-tertiary);
}
.recorrentes__vazio {
	margin: 0;
	font: var(--type-small);
	color: var(--text-tertiary);
}
.recorrentes__erro {
	margin: 0;
	font: var(--type-small);
	color: var(--feedback-danger);
}
</style>
