import { ref, computed } from "vue";

export const MONTH_NAMES = [
	"janeiro",
	"fevereiro",
	"março",
	"abril",
	"maio",
	"junho",
	"julho",
	"agosto",
	"setembro",
	"outubro",
	"novembro",
	"dezembro",
];

/**
 * Navegação de mês/ano.
 *
 * MUDANÇA (A5): o callback `onChange` foi removido. Ele existia para o
 * Dashboard recarregar os cards manualmente ao trocar de mês — mas os cards já
 * observam year/month por conta própria (useCardFetch), então cada clique
 * disparava DUAS requisições por card. Agora a mudança do mês é a única fonte
 * de verdade e os componentes reagem a ela via props.
 *
 * O mês corrente é lido em UTC para casar com o intervalo calculado no
 * backend (ver backend/src/utils/date.js — bug C2).
 */
/**
 * O dia de HOJE no calendário de quem está olhando, como `AAAA-MM-DD`.
 *
 * MOTIVO: `new Date().toISOString().slice(0, 10)` devolve o dia em UTC, que
 * depois das 21h no horário de Brasília já é o dia seguinte. Quem lançasse um
 * jantar às 22h recebia a data de amanhã preenchida — e data errada num app
 * financeiro muda o mês do saldo e a fatura em que a compra cai.
 *
 * O dia local é o que a pessoa chama de "hoje", e é esse que o backend grava
 * como `00:00:00.000Z` do dia ESCOLHIDO, não do fuso (ver utils/date.js).
 */
export function todayISO() {
	const now = new Date();
	const mes = String(now.getMonth() + 1).padStart(2, "0");
	const dia = String(now.getDate()).padStart(2, "0");

	return `${now.getFullYear()}-${mes}-${dia}`;
}

export function useMonthNavigation() {
	const now = new Date();
	const selectedYear = ref(now.getUTCFullYear());
	const selectedMonth = ref(now.getUTCMonth() + 1);

	const monthLabel = computed(
		() => `${MONTH_NAMES[selectedMonth.value - 1]} ${selectedYear.value}`
	);

	function previousMonth() {
		if (selectedMonth.value === 1) {
			selectedMonth.value = 12;
			selectedYear.value -= 1;
		} else {
			selectedMonth.value -= 1;
		}
	}

	function nextMonth() {
		if (selectedMonth.value === 12) {
			selectedMonth.value = 1;
			selectedYear.value += 1;
		} else {
			selectedMonth.value += 1;
		}
	}

	function goToMonth(month, year) {
		selectedMonth.value = month;
		selectedYear.value = year;
	}

	return {
		selectedYear,
		selectedMonth,
		monthLabel,
		previousMonth,
		nextMonth,
		goToMonth,
		MONTH_NAMES,
	};
}
