<template>
  <div class="tx">
    <div class="tx__bar">
      <div class="tx__filters">
        <GaSelect v-model="selectedMonth" :options="monthOptions" aria-label="Mês" />
        <GaSelect v-model="selectedYear" :options="yearOptions" aria-label="Ano" />
        <GaSelect v-model="typeFilter" :options="TYPE_OPTIONS" aria-label="Tipo" />
        <GaSelect v-model="categoryFilter" :options="categoryOptions" aria-label="Categoria" />
      </div>

      <!--
        Uma ação principal por tela, como a skill pede: lançar uma transação é
        o que se vem fazer aqui, então ela fica no primário cobalt. Criar
        categoria é apoio e vai na variante `secondary` — antes os dois
        botões eram iguais, `bg-lime-400`, e disputavam a mesma atenção.
      -->
      <div class="tx__actions">
        <GaButton variant="secondary" @click="showCategoryModal = true">
          <template #icon>
            <GaIcon name="tag" />
          </template>
          Criar categoria
        </GaButton>

        <GaButton variant="primary" @click="showModal = true">
          <template #icon>
            <GaIcon name="plus" />
          </template>
          Nova transação
        </GaButton>
      </div>
    </div>

    <!--
      A lista vive dentro de um card só, com as mesmas linhas do dashboard,
      em vez de um card por transação. Antes cada lançamento era um bloco
      branco de px-5 py-4 com texto text-xl e valor text-3xl: a mesma
      informação do dashboard ocupando o triplo da altura.
    -->
    <section class="tx__list">
      <div class="tx__listHead">
        <span class="tx__label">Transações</span>
        <span class="tx__total">{{ filteredTransactions.length }}</span>
      </div>

      <p v-if="loading" class="tx__state">Carregando...</p>

      <p v-else-if="error" class="tx__state tx__state--error">{{ error }}</p>

      <p v-else-if="!filteredTransactions.length" class="tx__state">
        Nenhuma transação para os filtros selecionados.
      </p>

      <ul v-else class="tx__items">
        <TransactionRow
          v-for="t in filteredTransactions"
          :key="t._id"
          :transaction="t"
          show-type
          @edit="startEdit"
          @delete="askDelete"
        />
      </ul>
    </section>

    <DeleteTransactionDialog
      :transaction="pendingDelete"
      :busy="deleting"
      :error="deleteError"
      @confirm="confirmDelete"
      @cancel="pendingDelete = null"
    />

    <NewTransactionalModal
      v-if="showModal"
      :year="selectedYear"
      :month="selectedMonth"
      @close="showModal = false"
      @transaction-created="reload"
    />

    <CategoriesModal v-if="showCategoryModal" @close="showCategoryModal = false" />

    <EditTransactionModal
      v-if="editing"
      :transaction="editing"
      @close="editing = null"
      @transaction-updated="reload"
    />
  </div>
</template>

<script setup>
/**
 * Transações.
 *
 * MIGRADA para o design system gestaoApp (ROADMAP 1.4). Nenhuma requisição,
 * nenhum estado e nenhum evento mudou; as linhas da lista já vinham do
 * `TransactionRow` migrado na primeira metade da etapa, e agora o chrome em
 * volta delas combina com elas. O que mudou de significado:
 *
 * - Os DOIS botões eram `bg-lime-400` com um círculo escuro em volta do "+",
 *   iguais entre si. A skill reserva o primário para UMA ação por tela: lançar
 *   transação é a ação da tela, criar categoria é apoio. Primário cobalt e
 *   `secondary`, respectivamente.
 * - Os quatro filtros eram `<select>` solto com `rounded-xl border-slate-200`.
 *   Agora são o `.ga-input` do sistema, com a seta `chevron-down` desenhada
 *   pelo próprio campo: a caixa usa `appearance: none`, que apaga a seta
 *   nativa.
 * - O `capitalize` do filtro de mês saiu. Ele maiusculiza cada palavra, e o
 *   que se quer é só a primeira letra do nome do mês.
 *
 * ── Etapa do GaSelect ────────────────────────────────────────────────────
 *
 * Os quatro filtros passaram de `GaField` + `<select>` para `GaSelect`, que
 * acima de 768px desenha o próprio painel e abaixo mantém o nativo. As opções
 * saíram do template e viraram listas, que é o contrato do componente (e o do
 * `Select` da skill, que também recebe `options`).
 *
 * Duas consequências que valem registro:
 *
 * - O `v-model.number` dos filtros de mês e ano saiu. O modificador não vale
 *   para componente — ele chega como `modelModifiers` para o componente
 *   aplicar. Não faz falta: as opções declaram `value` NUMÉRICO, e é esse
 *   valor que o componente emite, então `selectedMonth` e `selectedYear`
 *   continuam recebendo número. Confirmado no navegador: trocar o mês
 *   recarrega a lista, o que só acontece com o `watch` enxergando mudança.
 * - A maiúscula do nome do mês saiu do CSS (`.tx__month::first-letter`) e foi
 *   para o rótulo da opção. O painel é teleportado para o `<body>`, fora do
 *   escopo do `<style scoped>` desta tela, então uma regra daqui não
 *   alcançaria as linhas do painel — e as linhas precisam da mesma maiúscula
 *   que o controle fechado. O resultado na tela é o mesmo de antes: só a
 *   primeira letra, nunca a de cada palavra.
 *
 * ── Esqueleto de navegação ───────────────────────────────────────────────
 *
 * A casca (`div > Navbar + main`) saiu daqui: a navegação e o `<main>` são do
 * `AppShell`. As abas de topo (`AppTabs`) deixaram de existir — sidebar no
 * desktop, `GaTabBar` no celular.
 */
import { computed, onMounted, ref, watch } from "vue";
import GaButton from "@/design-system/components/GaButton.vue";
import GaIcon from "@/design-system/components/GaIcon.vue";
import GaSelect from "@/design-system/components/GaSelect.vue";
import TransactionRow from "../components/TransactionRow.vue";
import NewTransactionalModal from "../components/NewTransactionalModal.vue";
import EditTransactionModal from "../components/EditTransactionModal.vue";
import CategoriesModal from "../components/CategoriesModal.vue";
import DeleteTransactionDialog from "../components/DeleteTransactionDialog.vue";
import { useTransactions } from "../services/useTransactions";
import { useCategories } from "../stores/categories";
import { useMonthNavigation, MONTH_NAMES } from "../services/useMonthNavigation";
import { definePageAction } from "../stores/pageAction";

const { selectedYear, selectedMonth } = useMonthNavigation();
const { transactions, loading, error, loadTransactions, remove } = useTransactions();
const { categories, load: loadCategories } = useCategories();

const typeFilter = ref("all");
const categoryFilter = ref("all");
const showModal = ref(false);
const showCategoryModal = ref(false);
const editing = ref(null);

const pendingDelete = ref(null);
const deleting = ref(false);
const deleteError = ref("");

const currentYear = new Date().getUTCFullYear();

/*
 * `value` numérico, e é por isso que o `v-model` sem `.number` basta: o
 * GaSelect emite o valor da opção como ele é declarado aqui.
 */
const yearOptions = Array.from({ length: 7 }, (_, i) => {
  const year = currentYear - 3 + i;
  return { value: year, label: String(year) };
});

/** Só a primeira letra, nunca a de cada palavra — ver o cabeçalho do arquivo. */
const monthOptions = MONTH_NAMES.map((name, index) => ({
  value: index + 1,
  label: name.charAt(0).toUpperCase() + name.slice(1),
}));

const TYPE_OPTIONS = [
  { value: "all", label: "Todos os tipos" },
  { value: "income", label: "Receita" },
  { value: "debit", label: "Débito" },
  { value: "credit", label: "Crédito" },
  { value: "savings", label: "Guardado" },
  { value: "withdrawal", label: "Resgate" },
  { value: "invoice_payment", label: "Fatura paga" },
];

/*
 * BUG CORRIGIDO (M6), mantido: a opção "sem categoria" não existia. O filtro
 * comparava (t.category || "outros") com o nome da categoria, mas "outros"
 * nunca aparecia na lista de opções, então transações sem categoria eram
 * impossíveis de filtrar.
 */
const categoryOptions = computed(() => [
  { value: "all", label: "Todas as categorias" },
  { value: "none", label: "Sem categoria" },
  ...categories.value.map((category) => ({ value: category._id, label: category.name })),
]);

// O FAB central da barra inferior abre o mesmo modal do botão primário da tela.
definePageAction({ label: "Nova transação", run: () => (showModal.value = true) });

const filteredTransactions = computed(() =>
  transactions.value.filter((t) => {
    const passType = typeFilter.value === "all" || t.type === typeFilter.value;

    // A categoria vem populada como objeto ({_id, name, color}) ou null (A7).
    const categoryId = t.category?._id ?? null;
    const passCategory =
      categoryFilter.value === "all" ||
      (categoryFilter.value === "none" ? categoryId === null : categoryId === categoryFilter.value);

    return passType && passCategory;
  })
);

function reload() {
  showModal.value = false;
  editing.value = null;
  loadTransactions({ year: selectedYear.value, month: selectedMonth.value });
}

function startEdit(transaction) {
  editing.value = transaction;
}

function askDelete(transaction) {
  deleteError.value = "";
  pendingDelete.value = transaction;
}

/** @param {"single"|"group"} scope */
async function confirmDelete(scope) {
  deleting.value = true;
  deleteError.value = "";

  try {
    await remove(pendingDelete.value._id, scope);
    pendingDelete.value = null;
    // Recarrega porque scope="group" remove várias de uma vez, e o composable
    // só consegue tirar da lista local a que foi pedida.
    loadTransactions({ year: selectedYear.value, month: selectedMonth.value });
  } catch (err) {
    deleteError.value = err.displayMessage ?? "Erro ao excluir transação.";
  } finally {
    deleting.value = false;
  }
}

onMounted(() => {
  loadCategories();
  loadTransactions({ year: selectedYear.value, month: selectedMonth.value });
});

watch([selectedYear, selectedMonth], () => {
  loadTransactions({ year: selectedYear.value, month: selectedMonth.value });
});
</script>

<style scoped>
/*
 * A casca saiu: `min-height`, fundo, cor, `max-width`, `margin` e os dois
 * `padding` com breakpoint moram no `AppShell`. Só o empilhamento do conteúdo
 * desta tela ficou.
 */
.tx {
	display: flex;
	flex-direction: column;
	gap: var(--space-6);
}

/* ── Filtros e ações ───────────────────────────────────────────────────── */
.tx__bar {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}
@media (min-width: 1024px) {
	.tx__bar {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}
}

/*
 * Em 375px os quatro filtros vão dois por linha: um por linha deixaria a tela
 * com quatro faixas de 44px antes da primeira transação, e em quatro colunas
 * cada campo ficaria com 78px — menos que "Todas as categorias" precisa.
 */
.tx__filters {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: var(--space-2);
}
@media (min-width: 640px) {
	.tx__filters {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}
}
@media (min-width: 1024px) {
	.tx__filters {
		display: flex;
		flex-wrap: wrap;
	}
	.tx__filters > * {
		width: 150px;
	}
}

.tx__actions {
	display: flex;
	gap: var(--space-2);
}
.tx__actions > * {
	flex: 1;
}
@media (min-width: 1024px) {
	.tx__actions > * {
		flex: none;
	}
}

/* ── Card da lista ─────────────────────────────────────────────────────── */
/* `.ga-card` da skill, igual ao card de últimas transações do dashboard. */
.tx__list {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	min-width: 0;
	padding: var(--card-pad);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-card);
	background: var(--surface-card);
	box-shadow: var(--shadow-xs);
}

.tx__listHead {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-3);
}
.tx__label,
.tx__total {
	font: var(--type-label);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	color: var(--text-tertiary);
}
.tx__total {
	font-variant-numeric: tabular-nums;
}

.tx__state {
	padding: var(--space-4) 0;
	text-align: center;
	font: var(--type-small);
	color: var(--text-tertiary);
}
.tx__state--error {
	color: var(--feedback-danger);
}

.tx__items {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	margin: 0;
	padding: 0;
	list-style: none;
}
</style>
