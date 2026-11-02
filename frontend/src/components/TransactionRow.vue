<template>
  <li class="trow">
    <div class="trow__main">
      <span class="trow__tile" :class="`trow__tile--${style.tone}`" :title="formatType(transaction.type)">
        <GaIcon :name="style.icon" :size="16" :class="style.spin ? 'trow__flip' : undefined" />
      </span>
      <div class="trow__text">
        <p class="trow__desc">{{ transaction.description }}</p>
        <p class="trow__meta">
          {{ formatDate(transaction.date) }} · {{ formatSource(transaction) }}
          <template v-if="showType"> · {{ formatType(transaction.type) }}</template>
          <span v-if="transaction.installment?.total > 1" class="trow__installment">
            {{ transaction.installment.current }}/{{ transaction.installment.total }}
          </span>
        </p>
      </div>
    </div>

    <div class="trow__end">
      <span class="trow__amount" :class="isInflow(transaction.type) ? 'trow__amount--in' : 'trow__amount--out'">
        {{ amountSign(transaction.type) }} {{ formatCurrency(transaction.valueInCents) }}
      </span>

      <!--
        Botões "fantasma": o ícone continua discreto, mas a área de clique
        deixa de ser os 16px do próprio desenho — que no celular exigia mira.
        O fundo no hover mostra qual dos dois vai ser acionado.
      -->
      <div class="trow__actions">
        <button
          type="button"
          aria-label="Editar transação"
          title="Editar"
          class="trow__action"
          @click="emit('edit', transaction)"
        >
          <GaIcon name="pencil" :size="16" />
        </button>
        <button
          type="button"
          aria-label="Excluir transação"
          title="Excluir"
          class="trow__action trow__action--danger"
          @click="emit('delete', transaction)"
        >
          <GaIcon name="trash-2" :size="16" />
        </button>
      </div>
    </div>
  </li>
</template>

<script setup>
/**
 * Uma linha de transação, do jeito que o dashboard desenha.
 *
 * MOTIVO: a marcação da linha existia duas vezes — no card do dashboard e na
 * página de Transações — e as duas cópias já tinham divergido de escala. A
 * página usava text-xl na descrição e text-3xl no valor, contra text-sm em
 * ambos no dashboard, o que fazia as duas telas parecerem de aplicativos
 * diferentes. Com um componente só, elas não têm como divergir de novo.
 *
 * ── MIGRAÇÃO (ROADMAP 1.4) ────────────────────────────────────────────────
 *
 * Esta linha é compartilhada: o dashboard a usa via TransactionsList e a tela
 * de Transações a usa direto. A tela de Transações NÃO foi migrada nesta
 * etapa, então ela passa a mostrar linhas no desenho novo dentro do chrome
 * antigo. Isso é consequência conhecida e está no relatório da etapa; a
 * alternativa — duplicar a linha para preservar a tela antiga — desfaria
 * exatamente a unificação que o parágrafo acima descreve.
 *
 * A COR AQUI É INFORMAÇÃO, não paleta: verde é entrada e vermelho é saída.
 * O valor segue `isInflow` (receita e resgate entram; o resto sai), do mesmo
 * jeito que antes, e o que mudou é só de onde a cor vem:
 *
 *   antes                  depois                           o que significa
 *   text-emerald-600  ->   --feedback-success (green-600)    entra no saldo
 *   text-red-500      ->   --feedback-danger  (red-500)      sai do saldo
 *
 * `amountColor` de `useFormatters` devolvia essas duas classes do Tailwind e
 * deixou de ser usado por este componente — é o último consumidor dele. A
 * função foi mantida lá porque `services/` está fora do escopo desta etapa;
 * remover fica para a segunda metade.
 */
import { computed } from "vue";
import GaIcon from "../design-system/components/GaIcon.vue";
import { useFormatters } from "../services/useFormatters";

const props = defineProps({
  transaction: { type: Object, required: true },
  /**
   * Mostra o tipo na legenda. Ligado na página de Transações, onde a lista
   * mistura todos os tipos; desligado no dashboard, onde o ícone já basta e o
   * espaço é curto.
   */
  showType: { type: Boolean, default: false },
});

const emit = defineEmits(["edit", "delete"]);

const { formatCurrency, formatDate, formatSource, formatType, amountSign, isInflow } =
  useFormatters();

/**
 * Um ícone por tipo, todos do mesmo conjunto — agora Lucide, traço 1,75, o
 * conjunto do design system.
 *
 * Antes eram emojis (💳 🏦 🧾) misturados com setas de texto (↑ ↓ ↩). Emoji
 * muda de desenho em cada sistema operacional e não segue a cor definida no
 * CSS; misturado com caracteres de texto, dava à lista cara de protótipo.
 * Depois virou Heroicons 20 sólido, e agora Lucide de contorno.
 *
 * A tradução de Heroicons para Lucide não é um-para-um, porque o conjunto de
 * 74 ícones da skill é fechado:
 *
 *   income           ArrowUpIcon              -> arrow-up
 *   debit            ArrowDownIcon            -> arrow-up girado 180°
 *   credit           CreditCardIcon           -> credit-card
 *   savings          ArchiveBoxArrowDownIcon  -> download
 *   withdrawal       ArrowUturnLeftIcon       -> upload
 *   invoice_payment  DocumentCheckIcon        -> circle-check
 *
 * Não existe `arrow-down` no conjunto da skill. Em vez de desenhar um ícone
 * novo — que é justamente o que o design system existe para evitar — a seta de
 * saída é a `arrow-up` girada meia volta em CSS: mesmo traço, mesma ponta,
 * mesmo peso. `download`/`upload` formam o par de entrada e saída da reserva,
 * que antes eram dois ícones sem relação visual entre si.
 */
const TYPE_STYLES = {
  income: { icon: "arrow-up", tone: "in" },
  debit: { icon: "arrow-up", tone: "out", spin: true },
  credit: { icon: "credit-card", tone: "card" },
  savings: { icon: "download", tone: "saved" },
  // O caminho de volta da reserva para a conta.
  withdrawal: { icon: "upload", tone: "withdrawn" },
  invoice_payment: { icon: "circle-check", tone: "card" },
};

const style = computed(
  () => TYPE_STYLES[props.transaction.type] ?? { icon: "circle", tone: "neutral" }
);
</script>

<style scoped>
/* `.ga-task--stacked` da skill: raio 12, fio que escurece no hover. */
.trow {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-3);
	min-height: var(--row-height);
	padding: var(--space-2-5) var(--space-3);
	border: 1px solid var(--border-subtle);
	border-radius: 12px;
	background: var(--surface-card);
	transition:
		border-color var(--dur-fast) var(--ease-out),
		box-shadow var(--dur-fast) var(--ease-out);
}
.trow:hover {
	border-color: var(--border-default);
	box-shadow: var(--shadow-sm);
}

.trow__main {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	min-width: 0;
}

/* Quadradinho tingido do padrão `.ga-stat__icon`, redondo como já era. */
.trow__tile {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	flex-shrink: 0;
	border-radius: 50%;
}
.trow__flip {
	transform: rotate(180deg);
}

/* ── Cor que comunica: a natureza do movimento ─────────────────────────── */
.trow__tile--in {
	background: var(--green-50);
	color: var(--green-600);
}
.trow__tile--out {
	background: var(--red-50);
	color: var(--red-600);
}
.trow__tile--card {
	background: var(--orange-50);
	color: var(--orange-700);
}
.trow__tile--saved {
	background: var(--violet-50);
	color: var(--violet-600);
}
.trow__tile--withdrawn {
	background: var(--sky-50);
	color: var(--sky-600);
}
.trow__tile--neutral {
	background: var(--surface-sunken);
	color: var(--text-tertiary);
}

.trow__text {
	min-width: 0;
}
/*
 * ALTURA INTEIRA, DE PROPÓSITO — não é capricho tipográfico.
 *
 * `useFitToHeight` decide quantas linhas cabem no card dividindo a altura
 * disponível pela altura da PRIMEIRA linha, lida com `offsetHeight`, que é
 * arredondado para inteiro. Com as entrelinhas relativas do sistema
 * (14 × 1,45 + 12 × 1,4) a linha media 58,7px e o `offsetHeight` devolvia 59:
 * um pixel a mais do que o passo real. A cada medição a conta perdia uma
 * linha — 5, 4, 3, 2 — até o card mostrar UMA transação só no celular, onde
 * a altura do container vem do próprio conteúdo e a medição se realimenta.
 *
 * Com 20px e 16px a linha fecha em 58px cravados (20 de padding + 36 de
 * texto + 2 de borda), `offsetHeight` bate com o passo real e a conta fica
 * estável. Os tamanhos de fonte continuam os do sistema; só a entrelinha é
 * declarada em pixel.
 */
.trow__desc {
	margin: 0;
	font: var(--fw-medium) var(--fs-body) / 20px var(--font-ui);
	color: var(--text-primary);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.trow__meta {
	margin: 0;
	font: var(--fw-regular) var(--fs-caption) / 16px var(--font-ui);
	color: var(--text-tertiary);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
/*
 * O contador de parcela era `text-blue-600`: destaque, não sinal — não diz
 * entrada nem saída, diz "esta compra tem continuação". Destaque no sistema é
 * cobalt.
 */
.trow__installment {
	margin-left: var(--space-1);
	font-weight: var(--fw-semibold);
	color: var(--text-brand);
	font-variant-numeric: tabular-nums;
}

.trow__end {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	flex-shrink: 0;
}

/* ── O par que carrega o significado central da lista ──────────────────── */
.trow__amount {
	font: var(--fw-semibold) var(--fs-body) / 1.45 var(--font-ui);
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}
.trow__amount--in {
	color: var(--feedback-success);
}
.trow__amount--out {
	color: var(--feedback-danger);
}

.trow__actions {
	display: flex;
	align-items: center;
}

/*
 * `.ga-iconbtn--ghost` da skill, no tamanho de linha densa.
 *
 * ALVO DE TOQUE: o desenho tem 32px, e o `::after` estica a área clicável
 * para os 44px de altura que a skill exige no celular, sem ocupar espaço no
 * layout. A largura fica nos 32: são DOIS botões lado a lado numa linha de
 * 302px, e levar os dois a 44 de largura espremeria a descrição da transação
 * de 52px para 28px — medido. O espaço para isso aparece quando a segunda
 * metade da etapa trouxer o padrão de linha do celular.
 */
.trow__action {
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
.trow__action:hover {
	background: var(--surface-sunken);
	color: var(--text-primary);
}
.trow__action:active {
	transform: scale(0.94);
}
.trow__action--danger:hover {
	background: var(--feedback-danger-bg);
	color: var(--feedback-danger);
}
.trow__action:focus-visible {
	outline: none;
	box-shadow: var(--ring-focus);
}
@media (max-width: 767px) {
	.trow__action::after {
		content: "";
		position: absolute;
		inset: -6px 0;
	}
}
</style>
