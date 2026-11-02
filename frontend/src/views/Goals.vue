<template>
  <div class="goals">
    <header class="goals__head">
      <h1 class="goals__title">
        Metas <span class="goals__count">({{ goals.length }})</span>
      </h1>

      <GaButton variant="primary" @click="openCreate">
        <template #icon>
          <GaIcon name="plus" />
        </template>
        Nova meta
      </GaButton>
    </header>

    <p v-if="loading" class="goals__state">Carregando...</p>

    <p v-else-if="error" class="goals__state goals__state--error">{{ error }}</p>

    <!--
      Mesmo ritmo dos cards do dashboard: rótulo pequeno em maiúsculas, o
      número em destaque, e os detalhes miúdos embaixo. Antes o nome vinha em
      text-2xl e o valor em text-4xl — maior que o saldo do mês, que é o
      número mais importante da aplicação inteira.
    -->
    <ul v-else class="goals__grid">
      <li v-for="goal in goals" :key="goal._id" class="goals__card">
        <div class="goals__cardHead">
          <span class="goals__label" :title="goal.name">{{ goal.name }}</span>

          <!--
            Mesmos botões da lista de transações: ícone vazado numa área de
            clique de 32px. As margens negativas encostam os botões no canto
            do card, para que os 32px não aumentem a altura do cabeçalho.
          -->
          <div class="goals__actions">
            <button
              type="button"
              title="Editar"
              aria-label="Editar meta"
              class="goals__action"
              @click="startEdit(goal)"
            >
              <GaIcon name="pencil" :size="16" />
            </button>
            <button
              type="button"
              title="Excluir"
              aria-label="Excluir meta"
              class="goals__action goals__action--danger"
              @click="deleteConfirmation.open(goal._id)"
            >
              <GaIcon name="trash-2" :size="16" />
            </button>
          </div>
        </div>

        <div>
          <p class="goals__value">{{ formatCurrency(goal.currentAmountInCents) }}</p>
          <p class="goals__target">de {{ formatCurrency(goal.targetAmountInCents) }}</p>
        </div>

        <div class="goals__progress">
          <!--
            A COR DA BARRA É DADO, não decoração: é a cor que o usuário
            escolheu para a meta, e é por ela que ele reconhece a meta aqui,
            no card do dashboard e no gráfico. Não vira token. O padrão, para
            meta sem cor, é `--brand-primary`, que é o padrão de
            `.ga-progress__fill` na skill (era `#22c55e` cravado).
          -->
          <div class="goals__bar">
            <div
              class="goals__barFill"
              :style="{
                width: progress(goal) + '%',
                background: goal.color || 'var(--brand-primary)',
              }"
            ></div>
          </div>
          <div class="goals__meta">
            <span>{{ progress(goal) }}% concluído</span>
            <span>{{ goal.deadline ? formatDate(goal.deadline) : "sem prazo" }}</span>
          </div>
        </div>
      </li>
    </ul>

    <p v-if="!loading && !error && !goals.length" class="goals__state">
      Nenhuma meta cadastrada.
    </p>

    <ConfirmDialog
      :open="deleteConfirmation.isOpen.value"
      :busy="deleteConfirmation.busy.value"
      title="Excluir meta"
      message="Deseja realmente excluir esta meta?"
      @confirm="deleteConfirmation.confirm()"
      @cancel="deleteConfirmation.close()"
    />

    <GaModal
      v-if="showModal"
      :title="editingId ? 'Editar meta' : 'Nova meta'"
      size="lg"
      @close="closeModal"
    >
      <form id="goal-form" class="goals__form" @submit.prevent="saveGoal">
        <GaField v-slot="{ id }" class="goals__wide" label="Nome">
          <input :id="id" v-model="form.name" type="text" maxlength="120" required />
        </GaField>

        <GaField v-slot="{ id }" label="Valor alvo" variant="number">
          <input :id="id" v-model="form.targetAmount" type="number" min="0" step="0.01" required />
        </GaField>

        <GaField v-slot="{ id }" label="Valor atual" variant="number">
          <input :id="id" v-model="form.currentAmount" type="number" min="0" step="0.01" />
        </GaField>

        <GaField v-slot="{ id }" label="Prazo para concluir" variant="date">
          <input :id="id" v-model="form.deadline" type="date" />
        </GaField>

        <GaField v-slot="{ id }" label="Cor" variant="color">
          <input :id="id" v-model="form.color" type="color" />
        </GaField>

        <p v-if="formError" class="goals__wide goals__formError">{{ formError }}</p>
      </form>

      <template #footer>
        <GaButton variant="secondary" @click="closeModal">Cancelar</GaButton>
        <!-- Rótulo trocado e botão desabilitado: o estado de carregamento que
             o app já usava. A skill não define nenhum. -->
        <GaButton type="submit" form="goal-form" variant="primary" :disabled="saving">
          {{ saving ? "Salvando..." : "Salvar" }}
        </GaButton>
      </template>
    </GaModal>
  </div>
</template>

<script setup>
/**
 * Metas.
 *
 * MIGRADA para o design system gestaoApp (ROADMAP 1.4). Nenhuma requisição,
 * nenhum estado e nenhum evento mudou. O que mudou de significado:
 *
 * - "Nova meta" era `bg-lime-400` com um círculo escuro em volta do "+". Ação
 *   no sistema é cobalt, e o botão é o `GaButton` com o ícone Lucide `plus` —
 *   o mesmo desenho do botão de nova transação do dashboard, que já foi
 *   migrado.
 * - O valor guardado era `text-emerald-600`. Esse verde NÃO era sinal: é um
 *   saldo parcial, não entra nem sai de lugar nenhum. Virou tinta, exatamente
 *   como o total guardado do card de metas do dashboard, pelo mesmo motivo.
 * - O botão "Salvar" do modal era `bg-emerald-500`, verde de conclusão para
 *   uma ação que é só salvar. Virou o primário cobalt.
 * - Os dois ícones de linha saíram do Heroicons: PencilSquare -> `pencil`,
 *   Trash -> `trash-2`, os mesmos da linha de transação migrada.
 *
 * A BARRA DE PROGRESSO NÃO MUDA DE COR. Ela usa a cor da própria meta,
 * escolhida pelo usuário: isso é dado, não paleta. Só o padrão de quem nunca
 * escolheu saiu de `#22c55e` para `--brand-primary`, que é o padrão da skill.
 *
 * ── Esqueleto de navegação ───────────────────────────────────────────────
 *
 * A casca (`div > Navbar + main`) saiu daqui: a navegação e o `<main>` são do
 * `AppShell`. É a única tela cuja ação de criar NÃO é "Nova transação": o FAB
 * da barra inferior abre "Nova meta".
 */
import { onMounted, reactive, ref } from "vue";
import GaButton from "@/design-system/components/GaButton.vue";
import GaField from "@/design-system/components/GaField.vue";
import GaIcon from "@/design-system/components/GaIcon.vue";
import GaModal from "@/design-system/components/GaModal.vue";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import { useGoals } from "../services/useGoals";
import { useFormatters } from "../services/useFormatters";
import { useDeleteConfirmation } from "../services/useDeleteConfirmation";
import { definePageAction } from "../stores/pageAction";

const { goals, loading, error, loadGoals, createNew, update, remove } = useGoals();
const {
  formatCurrency,
  formatDate,
  formatDateForInput,
  calculateProgress,
  parseCurrencyToCents,
  centsToInputValue,
} = useFormatters();

const deleteConfirmation = useDeleteConfirmation(remove);

const showModal = ref(false);
const editingId = ref("");
const saving = ref(false);
const formError = ref("");

// Os campos de valor ficam em reais (como o usuário digita) e só viram
// centavos no envio — ver useFormatters.parseCurrencyToCents (C7).
const form = reactive({
  name: "",
  targetAmount: "0.00",
  currentAmount: "0.00",
  deadline: "",
  color: "#22c55e",
});

const progress = (goal) => calculateProgress(goal.currentAmountInCents, goal.targetAmountInCents);

function resetForm() {
  Object.assign(form, {
    name: "",
    targetAmount: "0.00",
    currentAmount: "0.00",
    deadline: "",
    color: "#22c55e",
  });
  editingId.value = "";
  formError.value = "";
}

function openCreate() {
  resetForm();
  showModal.value = true;
}

// O FAB central da barra inferior abre o mesmo modal do botão "Nova meta".
definePageAction({ label: "Nova meta", run: openCreate });

function startEdit(goal) {
  editingId.value = goal._id;
  Object.assign(form, {
    name: goal.name ?? "",
    targetAmount: centsToInputValue(goal.targetAmountInCents),
    currentAmount: centsToInputValue(goal.currentAmountInCents),
    // formatDateForInput lê a data em UTC, evitando o off-by-one-day que o
    // toISOString() sobre uma data local produzia (C2).
    deadline: formatDateForInput(goal.deadline),
    color: goal.color ?? "#22c55e",
  });
  formError.value = "";
  showModal.value = true;
}

async function saveGoal() {
  formError.value = "";

  const targetInCents = parseCurrencyToCents(form.targetAmount);
  const currentInCents = parseCurrencyToCents(form.currentAmount);

  if (targetInCents === null || currentInCents === null) {
    formError.value = "Informe valores numéricos válidos.";
    return;
  }
  if (targetInCents < 0 || currentInCents < 0) {
    formError.value = "Os valores não podem ser negativos.";
    return;
  }

  const payload = {
    name: form.name.trim(),
    targetAmountInCents: targetInCents,
    currentAmountInCents: currentInCents,
    color: form.color,
    deadline: form.deadline || null,
  };

  saving.value = true;

  try {
    if (editingId.value) {
      await update(editingId.value, payload);
    } else {
      await createNew(payload);
    }
    closeModal();
  } catch (err) {
    // Antes o erro só ia para o console.error e o modal fechava como se
    // tivesse dado certo.
    formError.value = err.displayMessage ?? "Erro ao salvar meta.";
  } finally {
    saving.value = false;
  }
}

function closeModal() {
  showModal.value = false;
  resetForm();
}

onMounted(loadGoals);
</script>

<style scoped>
/*
 * A casca saiu: `min-height`, fundo, cor, `max-width`, `margin` e os dois
 * `padding` com breakpoint moram no `AppShell`.
 */
.goals {
	display: flex;
	flex-direction: column;
	gap: var(--space-6);
}

.goals__head {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-3);
}
.goals__title {
	font: var(--type-page-title);
	letter-spacing: var(--ls-heading);
}
.goals__count {
	color: var(--text-tertiary);
	font-variant-numeric: tabular-nums;
}

.goals__state {
	padding: var(--space-8) 0;
	text-align: center;
	font: var(--type-small);
	color: var(--text-tertiary);
}
.goals__state--error {
	color: var(--feedback-danger);
}

/* ── Cards das metas ───────────────────────────────────────────────────── */
.goals__grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: var(--grid-gap);
	margin: 0;
	padding: 0;
	list-style: none;
}
@media (min-width: 640px) {
	.goals__grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}
@media (min-width: 1280px) {
	.goals__grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
}

/* `.ga-card` da skill, igual aos cards do dashboard. */
.goals__card {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
	min-width: 0;
	padding: var(--card-pad);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-card);
	background: var(--surface-card);
	box-shadow: var(--shadow-xs);
}

.goals__cardHead {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: var(--space-2);
}
.goals__label {
	min-width: 0;
	font: var(--type-label);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	color: var(--text-tertiary);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.goals__actions {
	display: flex;
	align-items: center;
	flex-shrink: 0;
	margin: -6px -6px 0 0;
}

/* `.ga-iconbtn--ghost` da skill, igual aos botões da linha de transação. */
.goals__action {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	flex-shrink: 0;
	border: 0;
	border-radius: var(--radius-md);
	background: transparent;
	color: var(--text-tertiary);
	cursor: pointer;
	transition:
		background var(--dur-fast) var(--ease-out),
		color var(--dur-fast) var(--ease-out),
		transform var(--dur-fast) var(--ease-out);
}
.goals__action:hover {
	background: var(--surface-sunken);
	color: var(--text-primary);
}
.goals__action:active {
	transform: scale(0.94);
}
.goals__action--danger:hover {
	background: var(--feedback-danger-bg);
	color: var(--feedback-danger);
}
.goals__action:focus-visible {
	outline: none;
	box-shadow: var(--ring-focus);
}
/* Alvo de 44px no celular, sem engordar o cabeçalho do card. */
@media (max-width: 767px) {
	.goals__action::after {
		content: "";
		position: absolute;
		inset: -6px;
	}
}

/*
 * O valor guardado é um stat, não um sinal — ver o comentário do script. 24px
 * é o tamanho de `.ga-stat--compact` da skill, o mesmo dos cards do dashboard.
 */
.goals__value {
	font: var(--fw-medium) 24px / 1 var(--font-display);
	letter-spacing: -0.02em;
	color: var(--text-primary);
	font-variant-numeric: tabular-nums;
}
.goals__target {
	margin-top: var(--space-1);
	font: var(--type-small);
	color: var(--text-tertiary);
	font-variant-numeric: tabular-nums;
}

.goals__progress {
	display: flex;
	flex-direction: column;
	gap: var(--space-1-5);
}
/* `.ga-progress` da skill, 8px como a barra que já existia. */
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
.goals__meta {
	display: flex;
	justify-content: space-between;
	gap: var(--space-2);
	font: var(--type-caption);
	color: var(--text-tertiary);
	font-variant-numeric: tabular-nums;
}

/* ── Formulário do modal ───────────────────────────────────────────────── */
.goals__form {
	display: grid;
	grid-template-columns: 1fr;
	gap: var(--space-4);
}
@media (min-width: 640px) {
	.goals__form {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	.goals__wide {
		grid-column: 1 / -1;
	}
}

.goals__formError {
	font: var(--type-small);
	color: var(--feedback-danger);
}
</style>
