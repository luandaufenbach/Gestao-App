<template>
  <section v-if="show" class="onb" aria-labelledby="onb-title">
    <header class="onb__head">
      <span class="onb__badge" aria-hidden="true">
        <GaIcon name="sparkle" :size="18" />
      </span>

      <div class="onb__intro">
        <h2 id="onb-title" class="onb__title">Comece por aqui</h2>
        <p class="onb__subtitle">
          Falta pouco para o painel ter o que mostrar. Este guia sai da tela sozinho quando o
          primeiro gasto for lançado.
        </p>
      </div>

      <span class="onb__count">{{ doneCount }} de {{ steps.length }}</span>
    </header>

    <ol class="onb__steps">
      <li
        v-for="step in steps"
        :key="step.id"
        class="onb__step"
        :class="{ 'onb__step--done': step.done }"
      >
        <span class="onb__mark" aria-hidden="true">
          <GaIcon :name="step.done ? 'circle-check' : 'circle'" :size="20" />
        </span>

        <div class="onb__text">
          <p class="onb__stepTitle">{{ step.title }}</p>
          <p class="onb__stepHint">{{ step.hint }}</p>
        </div>

        <GaButton
          v-if="step.event && !step.done"
          :variant="step.primary ? 'primary' : 'secondary'"
          size="sm"
          @click="emit(step.event)"
        >
          {{ step.cta }}
        </GaButton>

        <span v-else-if="step.done" class="onb__tag">
          <GaIcon name="check" :size="14" />
          pronto
        </span>
      </li>
    </ol>
  </section>
</template>

<script setup>
/**
 * Guia de primeiro uso do dashboard (ROADMAP 1.5).
 *
 * MOTIVO: conta nova cai num painel de seis cards, cada um dizendo "não tem
 * nada" à sua maneira. O usuário não descobre que já PODE lançar — as
 * categorias padrão nascem junto com a conta, em `authController.register` — e
 * visitante vindo de anúncio vai embora antes de ver valor nenhum.
 *
 * Por que passo a passo e NÃO dados de exemplo: transação falsa num app
 * financeiro mistura dinheiro inventado com dinheiro real e exige um caminho
 * de remoção que, se falhar, deixa número fantasma no saldo de alguém. Este
 * guia não grava nada — só lê.
 *
 * O estado sai do dado real, não de uma marca de "já vi isto": o guia aparece
 * enquanto a conta não tem lançamento nenhum e desaparece no primeiro. Não há
 * nada para persistir, nada para dessincronizar entre dispositivos e nada que
 * fique preso depois de uma conta apagar tudo e recomeçar.
 */
import { ref, computed, onMounted } from "vue";
import GaIcon from "@/design-system/components/GaIcon.vue";
import GaButton from "@/design-system/components/GaButton.vue";
import { getTransactions } from "@/services/api";
import { useBankCards } from "../stores/bankCards";

const emit = defineEmits(["add-card", "add-transaction"]);

const { cards, load: loadCards } = useBankCards();

const loaded = ref(false);
const hasTransactions = ref(false);

/**
 * Uma transação basta para saber que a conta não é nova, e `limit: 1` é a
 * consulta mais barata que responde isso.
 *
 * Sem `year`/`month` a rota não filtra por data, então a resposta vale para o
 * histórico inteiro. É o que importa aqui: usuário antigo num mês sem
 * lançamento não é usuário novo, e filtrar pelo mês corrente ressuscitaria o
 * guia para quem já usa o app.
 */
async function refetch() {
  try {
    const [transactions] = await Promise.all([getTransactions({ limit: 1 }), loadCards()]);
    hasTransactions.value = Array.isArray(transactions) && transactions.length > 0;
  } catch {
    // O guia é auxiliar. Se não deu para ler o estado, ele se esconde em vez de
    // adivinhar: melhor não aparecer do que mandar cadastrar o que já existe.
    hasTransactions.value = true;
  } finally {
    loaded.value = true;
  }
}

onMounted(refetch);

const show = computed(() => loaded.value && !hasTransactions.value);

const steps = computed(() => [
  {
    id: "categories",
    done: true,
    title: "Suas categorias já estão prontas",
    hint: "Criamos as mais comuns junto com a conta. Renomeie ou apague as que não usar.",
  },
  {
    id: "card",
    done: cards.value.length > 0,
    title: "Cadastre um cartão",
    hint: "Necessário só para compra no crédito e fatura. Dinheiro e débito não exigem cartão.",
    cta: "Cadastrar",
    event: "add-card",
  },
  {
    id: "transaction",
    done: hasTransactions.value,
    title: "Lance o primeiro gasto",
    hint: "É o que acende o painel: saldo do mês, gasto por categoria e projeção saem daqui.",
    cta: "Lançar gasto",
    event: "add-transaction",
    primary: true,
  },
]);

const doneCount = computed(() => steps.value.filter((step) => step.done).length);

// Mesmo contrato das cards do dashboard: a tela chama `refetch` depois de uma
// transação nascer, e o guia some sem precisar recarregar a página.
defineExpose({ refetch });
</script>

<style scoped>
.onb {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--card-pad);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.onb__head {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.onb__badge {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-icon);
  background: var(--surface-brand);
  color: var(--text-on-brand);
}

.onb__intro {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.onb__title {
  font: var(--type-title);
  letter-spacing: var(--ls-title);
  color: var(--text-primary);
}

.onb__subtitle {
  max-width: 62ch;
  font: var(--type-small);
  color: var(--text-secondary);
}

/* Contador à direita do título; no celular desce junto com o texto. */
.onb__count {
  flex-shrink: 0;
  margin-inline-start: auto;
  padding: var(--space-1) var(--space-2-5);
  border-radius: var(--radius-pill);
  background: var(--surface-sunken);
  font: var(--type-label);
  letter-spacing: var(--ls-label);
  color: var(--text-tertiary);
  white-space: nowrap;
}

.onb__steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.onb__step {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-control);
  background: var(--surface-raised);
}

/* O passo concluído recua: a atenção pertence ao que ainda falta fazer. */
.onb__step--done {
  border-color: transparent;
  background: transparent;
}

.onb__mark {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--text-tertiary);
}

.onb__step--done .onb__mark {
  color: var(--feedback-success);
}

.onb__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-0-5);
  min-width: 0;
}

.onb__stepTitle {
  font: var(--type-body-strong);
  color: var(--text-primary);
}

.onb__step--done .onb__stepTitle {
  color: var(--text-secondary);
}

.onb__stepHint {
  font: var(--type-caption);
  color: var(--text-tertiary);
}

.onb__tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
  font: var(--type-label);
  letter-spacing: var(--ls-label);
  color: var(--feedback-success);
}

/* O que fecha a linha — botão ou selo — encosta na direita. O texto não, senão
   a dica perde a largura que precisa. */
.onb__step > :last-child:not(.onb__text) {
  margin-inline-start: auto;
}

/* No celular o botão desce para baixo do texto, alinhado com ele: lado a lado
   sobra pouco mais de 20ch para a dica e ela quebra em quatro linhas. */
@media (max-width: 560px) {
  .onb__step {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .onb__step > :last-child:not(.onb__text) {
    margin-inline-start: calc(20px + var(--space-3));
  }
}
</style>
