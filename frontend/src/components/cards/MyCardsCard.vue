<template>
  <div class="cards">
    <span class="cards__label">Meus cartões</span>

    <div class="cards__stack">
      <div
        v-for="card in bankCards"
        :key="card._id"
        class="cards__card"
        :style="{ background: card.color || 'var(--ink-900)' }"
      >
        <div class="cards__cardTop">
          <span class="cards__bank">{{ card.bank || card.name }}</span>
          <div class="cards__cardTopEnd">
            <span class="cards__kind">
              {{ card.type === "credit" ? "Crédito" : "Débito" }}
            </span>
            <!--
              Favorito: o cartão que vem selecionado no card de Faturas e no
              formulário de transação. Um por vez — marcar outro troca.
            -->
            <button
              type="button"
              class="cards__star"
              :class="{ 'cards__star--on': card.starred }"
              :aria-pressed="Boolean(card.starred)"
              :aria-label="card.starred ? 'Remover dos favoritos' : 'Marcar como favorito'"
              :title="card.starred ? 'Cartão favorito' : 'Marcar como favorito'"
              :disabled="starringId === card._id"
              @click="toggleStar(card)"
            >
              <GaIcon name="star" :size="16" />
            </button>
          </div>
        </div>

        <p class="cards__digits">•••• •••• •••• {{ card.lastFourDigits }}</p>

        <div class="cards__cardFoot">
          <span class="cards__name">{{ card.name }}</span>
          <button
            type="button"
            class="cards__remove"
            title="Remover cartão"
            aria-label="Remover cartão"
            @click="deleteConfirmation.open(card._id)"
          >
            <GaIcon name="x" :size="14" />
          </button>
        </div>
      </div>

      <p v-if="!loading && !bankCards.length" class="cards__empty">Nenhum cartão adicionado</p>
    </div>

    <p v-if="errorMessage || error" class="cards__error">{{ errorMessage || error }}</p>

    <!-- `.ga-card--dashed.ga-card--interactive` da skill: o "criar" é tracejado
         e o hover dele é cobalt, não verde. -->
    <button type="button" class="cards__add" @click="toggleForm">
      <GaIcon name="plus" :size="16" />
      Adicionar cartão
    </button>

    <form v-if="showForm" class="cards__form" @submit.prevent="saveCard">
      <h3 class="cards__formTitle">Novo cartão</h3>

      <input
        v-model="form.name"
        type="text"
        placeholder="Nome (ex: Nubank Black)"
        maxlength="60"
        class="cards__input"
      />
      <input
        v-model="form.bank"
        type="text"
        placeholder="Banco (ex: Nubank)"
        maxlength="60"
        class="cards__input"
      />
      <input
        v-model="form.lastFourDigits"
        type="text"
        maxlength="4"
        inputmode="numeric"
        placeholder="Últimos 4 dígitos"
        class="cards__input"
      />

      <select v-model="form.type" class="cards__input cards__input--select">
        <option value="credit">Crédito</option>
        <option value="debit">Débito</option>
      </select>

      <!--
        Só cartão de crédito tem fatura. Sem estes dois dias, as compras não
        podem ser agrupadas por ciclo e o card de Faturas fica sem o que mostrar.
      -->
      <div v-if="form.type === 'credit'" class="cards__days">
        <div>
          <label for="card-closing" class="cards__fieldLabel">Fecha dia</label>
          <input
            id="card-closing"
            v-model.number="form.closingDay"
            type="number"
            min="1"
            max="31"
            placeholder="01"
            class="cards__input"
          />
        </div>
        <div>
          <label for="card-due" class="cards__fieldLabel">Vence dia</label>
          <input
            id="card-due"
            v-model.number="form.dueDay"
            type="number"
            min="1"
            max="31"
            placeholder="05"
            class="cards__input"
          />
        </div>
      </div>

      <div class="cards__colorRow">
        <label for="card-color" class="cards__fieldLabel">Cor:</label>
        <input id="card-color" v-model="form.color" type="color" class="cards__color" />
      </div>

      <div class="cards__formActions">
        <GaButton variant="secondary" block @click="showForm = false">Cancelar</GaButton>
        <!--
          Estado de carregamento: a skill não define nenhum, e nada foi
          inventado aqui. Continua o padrão do app — o rótulo vira
          "Salvando..." e o botão fica desabilitado.
        -->
        <GaButton type="submit" variant="primary" block :disabled="saving">
          {{ saving ? "Salvando..." : "Salvar" }}
        </GaButton>
      </div>
    </form>

    <ConfirmDialog
      :open="deleteConfirmation.isOpen.value"
      :busy="deleteConfirmation.busy.value"
      title="Remover cartão"
      message="As transações vinculadas serão mantidas, apenas desvinculadas deste cartão."
      confirm-label="Remover"
      @confirm="deleteConfirmation.confirm()"
      @cancel="deleteConfirmation.close()"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import GaButton from "@/design-system/components/GaButton.vue";
import GaIcon from "@/design-system/components/GaIcon.vue";
import { useBankCards } from "@/stores/bankCards";
import { useDeleteConfirmation } from "@/services/useDeleteConfirmation";
import ConfirmDialog from "../ConfirmDialog.vue";

/**
 * A lista de cartões vem da store, não de um composable próprio.
 *
 * Existiam duas implementações da mesma coisa: services/useBankCards (estado
 * local, só aqui) e stores/bankCards (singleton, no formulário de transação).
 * Com estados separados, cadastrar um cartão aqui não o fazia aparecer no
 * formulário até recarregar a página. Agora as duas telas olham para a mesma
 * lista, que é o que a store sempre se propôs a ser.
 *
 * MIGRADO para o design system gestaoApp (ROADMAP 1.4):
 *
 * - O "✕" de remover era o caractere de texto; virou o ícone Lucide `x`.
 * - A estrela do favorito era `text-amber-300`. Virou `--accent` (zest), a cor
 *   que a skill reserva para destaque e conquista — é o único lugar desta
 *   etapa em que o zest aparece. O desenho preenchido vem de CSS (`fill`), já
 *   que o conjunto da skill só traz a estrela de contorno.
 * - O botão "Adicionar cartão" tinha hover verde; agora é cobalt, como toda
 *   ação. Os campos tinham anel de foco `ring-green-400`; agora é a borda
 *   cobalt com anel de 3px, a regra de foco do sistema.
 * - A cor padrão do cartão era `#1e293b` (slate-800, da paleta antiga). Virou
 *   `#141823`, que é o `--ink-900`. É só o padrão do seletor: a cor escolhida
 *   pelo usuário continua intocada, e a de quem já tem cartão salvo também.
 */
const {
  cards: bankCards,
  loading,
  error,
  load: loadBankCards,
  create: createNew,
  setStarred,
  remove,
} = useBankCards();
const deleteConfirmation = useDeleteConfirmation(remove);

const showForm = ref(false);
const saving = ref(false);
const errorMessage = ref("");

/** Id do cartão com a estrela sendo salva, para travar cliques repetidos. */
const starringId = ref(null);

/** `--ink-900`, o neutro escuro do design system. */
const DEFAULT_CARD_COLOR = "#141823";

const form = reactive({
  name: "",
  bank: "",
  lastFourDigits: "",
  type: "credit",
  color: DEFAULT_CARD_COLOR,
});

function resetForm() {
  Object.assign(form, {
    name: "",
    bank: "",
    lastFourDigits: "",
    type: "credit",
    color: DEFAULT_CARD_COLOR,
    closingDay: null,
    dueDay: null,
  });
}

function toggleForm() {
  showForm.value = !showForm.value;
  errorMessage.value = "";
}

async function toggleStar(card) {
  errorMessage.value = "";
  starringId.value = card._id;

  try {
    await setStarred(card._id, !card.starred);
  } catch (err) {
    errorMessage.value = err.displayMessage ?? "Erro ao atualizar o cartão favorito.";
  } finally {
    starringId.value = null;
  }
}

async function saveCard() {
  errorMessage.value = "";

  const digitsOnly = String(form.lastFourDigits || "").replace(/\D/g, "");

  if (!form.name.trim()) {
    errorMessage.value = "Informe o nome do cartão.";
    return;
  }
  if (digitsOnly.length !== 4) {
    errorMessage.value = "Informe exatamente os 4 últimos dígitos.";
    return;
  }

  const isCredit = form.type === "credit";
  const hasClosing = isCredit && Boolean(form.closingDay);
  const hasDue = isCredit && Boolean(form.dueDay);

  // O backend recusa um dia sem o outro; avisamos antes de tentar.
  if (hasClosing !== hasDue) {
    errorMessage.value = "Informe o dia de fechamento e o de vencimento juntos.";
    return;
  }

  saving.value = true;

  try {
    await createNew({
      name: form.name.trim(),
      bank: form.bank.trim(),
      lastFourDigits: digitsOnly,
      type: form.type,
      color: form.color,
      // Cartão de débito não tem fatura: os dias vão nulos.
      closingDay: hasClosing ? form.closingDay : null,
      dueDay: hasDue ? form.dueDay : null,
    });

    resetForm();
    showForm.value = false;
  } catch (err) {
    // Antes, um erro aqui era completamente silencioso: saveCard não tinha
    // try/catch e a promise rejeitada morria no console.
    errorMessage.value = err.displayMessage ?? "Erro ao salvar cartão.";
  } finally {
    saving.value = false;
  }
}

onMounted(loadBankCards);
</script>

<style scoped>
.cards {
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

.cards__label {
	font: var(--type-label);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	color: var(--text-tertiary);
}

.cards__stack {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

/*
 * O cartão em si é "momento de marca": fundo da cor escolhida pelo usuário,
 * texto branco. Raio 12 como as linhas do sistema.
 */
.cards__card {
	position: relative;
	overflow: hidden;
	padding: var(--space-4);
	border-radius: 12px;
	color: #fff;
}
.cards__cardTop {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	margin-bottom: var(--space-4);
}
.cards__cardTopEnd {
	display: flex;
	align-items: center;
	gap: var(--space-2);
}
.cards__bank {
	font: var(--type-micro);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	opacity: 0.8;
}
.cards__kind {
	font: var(--fw-medium) var(--fs-caption) / 1 var(--font-ui);
	opacity: 0.7;
}

.cards__star {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin: calc(var(--space-1) * -1);
	padding: var(--space-1);
	border: 0;
	border-radius: var(--radius-sm);
	background: transparent;
	color: rgba(255, 255, 255, 0.45);
	cursor: pointer;
	transition:
		color var(--dur-fast) var(--ease-out),
		transform var(--dur-fast) var(--ease-out);
}
.cards__star:hover:not(:disabled) {
	color: rgba(255, 255, 255, 0.85);
}
.cards__star:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
.cards__star:focus-visible {
	outline: none;
	box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.7);
}
/*
 * Marcado: zest preenchido. O conjunto da skill só tem a estrela de contorno,
 * então o preenchimento vem daqui — a regra de CSS vence o atributo
 * `fill="none"` do `<svg>`, e os paths herdam o `fill` do pai.
 */
.cards__star--on {
	color: var(--accent);
}
.cards__star--on :deep(.ga-icon) {
	fill: currentColor;
}
/*
 * Alvo de toque de 44px no celular por `::after`: o desenho da estrela e do
 * "✕" tem de continuar discreto dentro do cartão, então a área clicável
 * cresce sem ocupar espaço no layout.
 */
@media (max-width: 767px) {
	.cards__star::after,
	.cards__remove::after {
		content: "";
		position: absolute;
		inset: -11px;
	}
}

.cards__digits {
	margin: 0;
	font: var(--fw-regular) var(--fs-body) / 1.4 var(--font-mono);
	letter-spacing: 0.15em;
	opacity: 0.9;
}

.cards__cardFoot {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	margin-top: var(--space-3);
}
.cards__name {
	font: var(--fw-medium) var(--fs-caption) / 1 var(--font-ui);
	opacity: 0.7;
}
.cards__remove {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin: calc(var(--space-1) * -1);
	padding: var(--space-1);
	border: 0;
	border-radius: var(--radius-sm);
	background: transparent;
	color: rgba(255, 255, 255, 0.5);
	cursor: pointer;
	transition: color var(--dur-fast) var(--ease-out);
}
.cards__remove:hover {
	color: rgba(255, 255, 255, 0.9);
}
.cards__remove:focus-visible {
	outline: none;
	box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.7);
}

.cards__empty {
	margin: 0;
	padding: var(--space-4) 0;
	text-align: center;
	font: var(--type-small);
	color: var(--text-tertiary);
}

.cards__error {
	margin: 0;
	font: var(--type-caption);
	color: var(--feedback-danger);
}

.cards__add {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: var(--space-2);
	width: 100%;
	/* `--hit-min`: alvo de 44px também no desktop — é um botão de largura
	   inteira, então a altura não custa nada ao layout. */
	min-height: var(--hit-min);
	padding: var(--space-2-5) 0;
	border: 1.5px dashed var(--border-dashed);
	border-radius: 12px;
	background: transparent;
	color: var(--text-tertiary);
	font: var(--type-body-strong);
	cursor: pointer;
	transition:
		border-color var(--dur-base) var(--ease-out),
		background var(--dur-base) var(--ease-out),
		color var(--dur-base) var(--ease-out);
}
.cards__add:hover {
	border-color: var(--cobalt-300);
	background: var(--brand-primary-soft);
	color: var(--text-brand);
}
.cards__add:focus-visible {
	outline: none;
	border-color: var(--border-focus);
	box-shadow: var(--ring-focus);
}

.cards__form {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
	padding: var(--space-4);
	border: 1px solid var(--border-default);
	border-radius: 12px;
}
.cards__formTitle {
	margin: 0;
	font: var(--fw-medium) var(--fs-body) / 1.3 var(--font-display);
	letter-spacing: var(--ls-title);
	color: var(--text-primary);
}

/* Campo no padrão do sistema: raio 10, fio `--border-default`, foco cobalt. */
.cards__input {
	width: 100%;
	padding: var(--space-2) var(--space-3);
	border: 1px solid var(--border-default);
	border-radius: var(--radius-control);
	background: var(--surface-card);
	font: var(--type-body);
	color: var(--text-primary);
}
.cards__input::placeholder {
	color: var(--text-tertiary);
}
.cards__input:focus {
	outline: none;
	border-color: var(--border-focus);
	box-shadow: var(--ring-focus);
}
.cards__input--select {
	cursor: pointer;
}

.cards__days {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--space-2);
}
.cards__fieldLabel {
	display: block;
	margin-bottom: var(--space-1);
	font: var(--type-caption);
	color: var(--text-secondary);
}

.cards__colorRow {
	display: flex;
	align-items: center;
	gap: var(--space-2);
}
.cards__colorRow .cards__fieldLabel {
	margin-bottom: 0;
}
.cards__color {
	width: 48px;
	height: 32px;
	padding: 0;
	border: 1px solid var(--border-default);
	border-radius: var(--radius-sm);
	background: var(--surface-card);
	cursor: pointer;
}

.cards__formActions {
	display: flex;
	gap: var(--space-2);
}
</style>
