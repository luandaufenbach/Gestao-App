<template>
  <div ref="root" class="goals">
    <div class="goals__head">
      <div class="goals__nav">
        <button type="button" aria-label="Painel anterior" class="goals__arrow" @click="prevSlide">
          <GaIcon name="chevron-left" :size="14" />
        </button>
        <button type="button" aria-label="Próximo painel" class="goals__arrow" @click="nextSlide">
          <GaIcon name="chevron-right" :size="14" />
        </button>
      </div>
      <span class="goals__counter">{{ activeSlide + 1 }}/2</span>
    </div>

    <div v-if="activeSlide === 0" class="goals__slide">
      <div class="goals__total">
        <span class="goals__label">Valor guardado total</span>
        <p class="goals__totalValue">{{ formatCurrency(savedInCents) }}</p>
        <!--
          Era "Histórico acumulado guardado". Com o resgate, o número deixou de
          ser um acumulado que só cresce e passou a ser o saldo real da reserva.
        -->
        <p class="goals__totalHint">Disponível na sua reserva</p>
      </div>

      <!--
        Os depósitos preenchem o espaço que sobrava embaixo do total: o card é
        o mais baixo da linha do grid e era esticado até a altura do saldo do
        mês, ficando com um bloco de branco. Quantos cabem é medido em runtime.
      -->
      <div v-if="deposits.length" class="goals__fill">
        <span class="goals__label">Depósitos recentes</span>

        <ul ref="depositList" class="goals__list">
          <li v-for="deposit in visibleDeposits" :key="deposit._id" class="goals__deposit">
            <div class="goals__depositMeta">
              <p class="goals__depositName">{{ deposit.description }}</p>
              <p class="goals__depositDate">
                {{ formatDate(deposit.date) }}
                <template v-if="deposit.goal"> · {{ deposit.goal.name }}</template>
              </p>
            </div>
            <span class="goals__depositValue">+ {{ formatCurrency(deposit.valueInCents) }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div v-else class="goals__slide">
      <div class="goals__head">
        <span class="goals__label">Metas</span>
        <RouterLink to="/goals" class="goals__more">
          Ver mais
          <GaIcon name="arrow-right" :size="14" />
        </RouterLink>
      </div>

      <!--
        Antes só uma meta aparecia por vez, com botões "meta anterior/próxima".
        Agora a lista mostra todas as que couberem na altura do card — o mesmo
        espaço em branco que os depósitos resolvem no outro painel.
      -->
      <ul v-if="goals.length" ref="goalList" class="goals__list">
        <li v-for="goal in visibleGoals" :key="goal._id" class="goals__goal">
          <div class="goals__goalTop">
            <span class="goals__goalName">{{ goal.name }}</span>
            <span class="goals__goalPercent">{{ percentOf(goal) }}%</span>
          </div>

          <div class="goals__bar">
            <div
              class="goals__barFill"
              :style="{
                width: percentOf(goal) + '%',
                background: goal.color || 'var(--brand-primary)',
              }"
            ></div>
          </div>

          <div class="goals__goalRange">
            <span>{{ formatCurrency(goal.currentAmountInCents) }}</span>
            <span>{{ formatCurrency(goal.targetAmountInCents) }}</span>
          </div>
        </li>
      </ul>

      <div v-else class="goals__empty">Nenhuma meta cadastrada.</div>
    </div>

    <p v-if="error" class="goals__error">{{ error }}</p>
  </div>
</template>

<script setup>
/**
 * Card de reserva e metas.
 *
 * MIGRADO para o design system gestaoApp (ROADMAP 1.4). O que mudou de
 * significado:
 *
 * - O total guardado era `text-emerald-600`. Esse verde NÃO era sinal: é um
 *   saldo, sem sinal e sem direção, e verde no sistema quer dizer entrada ou
 *   conclusão. O número agora é tinta (`--text-primary`), como todo valor de
 *   stat da skill. O que ele é está escrito do lado ("Disponível na sua
 *   reserva"), não na cor.
 * - Os depósitos eram `text-blue-600`. Viraram `--violet-600`, a MESMA cor que
 *   a linha "Guardado" usa no card de saldo do mês: nos dois lugares o valor é
 *   dinheiro indo para a reserva, e azul agora é vizinho do cobalt de ação.
 * - A barra de progresso tinha `#22c55e` cravado como cor padrão. A cor
 *   escolhida pelo usuário na meta continua valendo; o padrão virou
 *   `--brand-primary`, que é o padrão de `.ga-progress__fill` na skill.
 * - O hover de "Ver mais" era `text-emerald-600`; link e hover são cobalt.
 */
import { ref, computed, onMounted, watch, useTemplateRef } from "vue";
import { RouterLink } from "vue-router";
import GaIcon from "@/design-system/components/GaIcon.vue";
import { getTotalSavedMoney, getGoals, getTransactions } from "@/services/api";
import { useFormatters } from "@/services/useFormatters";
import { useFitToHeight } from "@/services/useFitToHeight";

const { formatCurrency, formatDate, calculateProgress } = useFormatters();

const savedInCents = ref(0);
const goals = ref([]);
const deposits = ref([]);
const activeSlide = ref(0);
const error = ref("");

/** Teto do que é buscado; o que aparece é o que couber na altura do card. */
const DEPOSITS_LIMIT = 15;

const rootEl = useTemplateRef("root");
const depositListEl = useTemplateRef("depositList");
const goalListEl = useTemplateRef("goalList");

const depositsFit = useFitToHeight(rootEl, depositListEl, { initial: 3, fallbackRowHeight: 54 });
const goalsFit = useFitToHeight(rootEl, goalListEl, { initial: 2, fallbackRowHeight: 74 });

const visibleDeposits = computed(() => deposits.value.slice(0, depositsFit.capacity.value));
const visibleGoals = computed(() => goals.value.slice(0, goalsFit.capacity.value));

const percentOf = (item) => calculateProgress(item.currentAmountInCents, item.targetAmountInCents);

function prevSlide() {
  activeSlide.value = activeSlide.value === 0 ? 1 : 0;
}

function nextSlide() {
  activeSlide.value = activeSlide.value === 1 ? 0 : 1;
}

async function refetch() {
  error.value = "";

  try {
    // Antes, qualquer uma das chamadas falhando derrubava as outras sem aviso:
    // fetchAll não tinha try/catch e o erro virava uma promise rejeitada solta.
    const [saved, goalsData, depositsData] = await Promise.all([
      getTotalSavedMoney(),
      getGoals(),
      // Só os depósitos: o resgate é o caminho inverso e já aparece no card de
      // saldo do mês. Sem year/month, são os mais recentes de todo o histórico.
      getTransactions({ type: "savings", limit: DEPOSITS_LIMIT }),
    ]);

    savedInCents.value = saved?.savedInCents ?? 0;
    goals.value = Array.isArray(goalsData) ? goalsData : [];
    deposits.value = Array.isArray(depositsData) ? depositsData : [];
  } catch (err) {
    error.value = err.displayMessage ?? "Erro ao carregar metas";
  }
}

// Cada painel tem a sua lista. Ao trocar de painel — ou quando os dados
// chegam — a lista visível acabou de entrar no DOM e ainda não foi medida.
watch([activeSlide, deposits, goals], () => {
  depositsFit.remeasure();
  goalsFit.remeasure();
});

onMounted(refetch);

defineExpose({ refetch });
</script>

<style scoped>
.goals {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	min-width: 0;
	padding: var(--card-pad);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-card);
	background: var(--surface-card);
	box-shadow: var(--shadow-xs);
	color: var(--text-primary);
}
@media (min-width: 768px) {
	.goals {
		height: 100%;
	}
}

.goals__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-3);
}
.goals__nav {
	display: flex;
	align-items: center;
	gap: var(--space-1);
}

/*
 * `.ga-iconbtn--soft.ga-iconbtn--circle` da skill.
 *
 * O desenho continua com 28px; no celular o `::after` estica a área clicável
 * para os 44px que a skill exige, sem engordar o cabeçalho do card.
 */
.goals__arrow {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	flex-shrink: 0;
	border: 0;
	border-radius: 50%;
	background: var(--surface-sunken);
	color: var(--text-secondary);
	cursor: pointer;
	transition:
		background var(--dur-fast) var(--ease-out),
		color var(--dur-fast) var(--ease-out),
		transform var(--dur-fast) var(--ease-out);
}
.goals__arrow:hover {
	background: var(--ink-100);
	color: var(--text-primary);
}
.goals__arrow:active {
	transform: scale(0.94);
}
.goals__arrow:focus-visible {
	outline: none;
	box-shadow: var(--ring-focus);
}
@media (max-width: 767px) {
	.goals__arrow::after {
		content: "";
		position: absolute;
		inset: -8px;
	}
}

.goals__counter {
	font: var(--type-label);
	color: var(--text-tertiary);
	font-variant-numeric: tabular-nums;
}

.goals__label {
	font: var(--type-label);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	color: var(--text-tertiary);
}

.goals__slide {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}
.goals__fill {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}
@media (min-width: 768px) {
	.goals__slide,
	.goals__fill {
		flex: 1;
		min-height: 0;
	}
}

.goals__total {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}
/*
 * O total é um stat, não um sinal: tinta, 32px, Outfit 500 — `--type-stat` da
 * skill. Era verde 30px em peso 700.
 */
.goals__totalValue {
	margin: 0;
	font: var(--type-stat);
	letter-spacing: -0.02em;
	color: var(--text-primary);
	font-variant-numeric: tabular-nums;
}
.goals__totalHint {
	margin: 0;
	font: var(--type-small);
	color: var(--text-tertiary);
}

.goals__more {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	font: var(--type-body-strong);
	color: var(--text-secondary);
	text-decoration: none;
	transition: color var(--dur-fast) var(--ease-out);
}
.goals__more:hover {
	color: var(--text-link);
}
.goals__more:focus-visible {
	outline: none;
	border-radius: var(--radius-sm);
	box-shadow: var(--ring-focus);
}

.goals__list {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	margin: 0;
	padding: 0;
	list-style: none;
}
@media (min-width: 768px) {
	.goals__list {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}
}

.goals__deposit {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-2);
	padding: var(--space-2) var(--space-3);
	border: 1px solid var(--border-subtle);
	border-radius: 12px;
}
.goals__depositMeta {
	min-width: 0;
}
.goals__depositName {
	margin: 0;
	font: var(--type-body-strong);
	color: var(--text-primary);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.goals__depositDate {
	margin: 0;
	font: var(--type-caption);
	color: var(--text-tertiary);
}
/* Cor que comunica: dinheiro indo para a reserva, igual à linha "Guardado" do
   card de saldo do mês. */
.goals__depositValue {
	font: var(--fw-semibold) var(--fs-body) / 1.45 var(--font-ui);
	color: var(--violet-600);
	white-space: nowrap;
	font-variant-numeric: tabular-nums;
}

.goals__goal {
	display: flex;
	flex-direction: column;
	gap: var(--space-1-5);
	padding: var(--space-2) var(--space-3);
	border: 1px solid var(--border-subtle);
	border-radius: 12px;
}
.goals__goalTop {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-2);
}
.goals__goalName {
	font: var(--type-body-strong);
	color: var(--text-primary);
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.goals__goalPercent {
	font: var(--type-caption);
	color: var(--text-secondary);
	white-space: nowrap;
	font-variant-numeric: tabular-nums;
}
.goals__goalRange {
	display: flex;
	justify-content: space-between;
	font: var(--type-caption);
	color: var(--text-tertiary);
	font-variant-numeric: tabular-nums;
}

/* `.ga-progress` da skill, 8px de altura como a barra que já existia. */
.goals__bar {
	width: 100%;
	height: 8px;
	border-radius: var(--radius-pill);
	background: var(--ink-100);
	overflow: hidden;
}
.goals__barFill {
	height: 100%;
	border-radius: inherit;
	transition: width var(--dur-slow) var(--ease-out);
}

.goals__empty {
	padding: var(--space-5) 0;
	text-align: center;
	font: var(--type-small);
	color: var(--text-tertiary);
}

.goals__error {
	margin: 0;
	font: var(--type-caption);
	color: var(--feedback-danger);
}
</style>
