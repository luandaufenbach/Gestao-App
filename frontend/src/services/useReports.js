import { ref, computed } from "vue";
import { getMonthlyReport } from "./api";

/**
 * Relatórios de 3 a 12 meses (ROADMAP 1.2).
 *
 * O composable fica com a busca, com a troca de janela e com o recorte dos
 * dados para os gráficos; a view cuida só de desenhar. Não usa `useCardFetch`
 * porque a rota não aceita year/month — a janela termina sempre no mês
 * corrente, então não há nada para observar nas props.
 */

/** Janelas oferecidas na tela. O backend aceita qualquer inteiro de 3 a 12. */
export const REPORT_WINDOWS = [3, 6, 12];

export const DEFAULT_REPORT_MONTHS = 6;

/**
 * Quantas categorias entram no gráfico empilhado antes de virar "Outras".
 *
 * Doze meses de barras empilhadas com dez categorias cada viram listras
 * indistinguíveis em 375px, e a legenda ocupa mais tela que o gráfico. As
 * maiores ficam; o resto soma numa faixa cinza, que continua sendo o total
 * correto do mês.
 */
const MAX_CHART_CATEGORIES = 5;

/** Cinza do token `--ink-400`, o mesmo do texto terciário. */
const OTHERS_COLOR = "#9DA2AE";

const emptyTotals = () => ({
	incomeInCents: 0,
	expenseInCents: 0,
	netResultInCents: 0,
	averageIncomeInCents: 0,
	averageExpenseInCents: 0,
});

export function useReports(initialMonths = DEFAULT_REPORT_MONTHS) {
	const months = ref(initialMonths);
	const series = ref([]);
	const totals = ref(emptyTotals());
	const categories = ref([]);
	const loading = ref(false);
	const error = ref("");

	// Descarta resposta de requisição antiga que chegue fora de ordem — o
	// usuário clicando rápido entre 3, 6 e 12 meses.
	let requestId = 0;

	async function load() {
		const currentRequest = ++requestId;

		loading.value = true;
		error.value = "";

		try {
			const data = await getMonthlyReport({ months: months.value });

			if (currentRequest !== requestId) return;

			series.value = Array.isArray(data?.series) ? data.series : [];
			totals.value = data?.totals ?? emptyTotals();
			categories.value = Array.isArray(data?.categories) ? data.categories : [];
		} catch (err) {
			if (currentRequest !== requestId) return;

			error.value = err.displayMessage ?? "Erro ao carregar o relatório";
			series.value = [];
			totals.value = emptyTotals();
			categories.value = [];
		} finally {
			if (currentRequest === requestId) loading.value = false;
		}
	}

	/** Troca a janela e recarrega. Clicar na janela já aberta não faz nada. */
	function setMonths(value) {
		if (value === months.value) return;

		months.value = value;
		return load();
	}

	/**
	 * Nada lançado na janela inteira.
	 *
	 * A série vem completa e zerada, então sem esta checagem a tela desenharia
	 * seis barras vazias — um gráfico dizendo "zero" sem dizer por quê.
	 */
	const isEmpty = computed(
		() =>
			!loading.value &&
			!error.value &&
			series.value.length > 0 &&
			totals.value.incomeInCents === 0 &&
			totals.value.expenseInCents === 0
	);

	/** O maior mês da janela, em despesa: é a régua das barras da variação. */
	const peakExpenseInCents = computed(() =>
		series.value.reduce((peak, item) => Math.max(peak, item.expenseInCents ?? 0), 0)
	);

	/**
	 * Categorias do gráfico empilhado: as maiores, mais uma faixa "Outras".
	 *
	 * `monthlyInCents` já vem do backend alinhado posição por posição com
	 * `series`, então a soma de "Outras" é feita índice a índice — nenhuma
	 * busca por chave de mês, e a ordem dos meses nunca entra em jogo.
	 */
	const chartCategories = computed(() => {
		const list = categories.value;

		// Com uma categoria sobrando, agrupar não economizaria nada: "Outras"
		// ocuparia a mesma linha de legenda que a própria categoria.
		if (list.length <= MAX_CHART_CATEGORIES + 1) return list;

		const top = list.slice(0, MAX_CHART_CATEGORIES);
		const rest = list.slice(MAX_CHART_CATEGORIES);

		return [
			...top,
			{
				categoryId: null,
				category: "Outras",
				color: OTHERS_COLOR,
				totalInCents: rest.reduce((sum, item) => sum + item.totalInCents, 0),
				monthlyInCents: series.value.map((_, index) =>
					rest.reduce((sum, item) => sum + (item.monthlyInCents[index] ?? 0), 0)
				),
			},
		];
	});

	return {
		months,
		series,
		totals,
		categories,
		chartCategories,
		loading,
		error,
		isEmpty,
		peakExpenseInCents,
		load,
		setMonths,
	};
}
