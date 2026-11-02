import { ref, computed } from "vue";
import { getProjection } from "./api";

/**
 * Projeção de caixa: quanto já está comprometido nos próximos meses.
 *
 * O composable fica com a busca e com os números derivados da série; a view
 * cuida só de desenhar. Não usa `useCardFetch` porque a rota não aceita
 * year/month — a janela começa sempre no mês corrente, então não há nada para
 * observar nas props.
 */

/** Janela padrão. O backend aceita de 1 a 24 e recusa o resto com 400. */
export const PROJECTION_MONTHS = 6;

/**
 * Piso da barra, em porcentagem.
 *
 * Um mês com compromisso pequeno ao lado de um mês muito grande daria uma barra
 * de largura zero arredondada — visualmente idêntica a "nada comprometido",
 * que é mentira. Com o piso, qualquer valor acima de zero aparece.
 */
const MIN_BAR_PERCENT = 2;

export function useProjection(months = PROJECTION_MONTHS) {
	const series = ref([]);
	const loading = ref(false);
	const error = ref("");

	async function load() {
		loading.value = true;
		error.value = "";

		try {
			// A rota devolve um ARRAY puro, não um objeto com a série dentro.
			const data = await getProjection({ months });
			series.value = Array.isArray(data) ? data : [];
		} catch (err) {
			error.value = err.displayMessage ?? "Erro ao carregar a projeção";
			series.value = [];
		} finally {
			loading.value = false;
		}
	}

	/** Soma de um campo da série, em centavos — tudo inteiro, sem float. */
	const sumOf = (field) =>
		computed(() => series.value.reduce((total, entry) => total + (entry[field] ?? 0), 0));

	const totalCommittedInCents = sumOf("committedInCents");
	const totalInvoicesInCents = sumOf("invoicesInCents");
	const totalDebitsInCents = sumOf("debitsInCents");

	/** O mês mais pesado da janela: é a régua das barras. */
	const peakInCents = computed(() =>
		series.value.reduce((peak, entry) => Math.max(peak, entry.committedInCents ?? 0), 0)
	);

	/**
	 * Nada comprometido na janela inteira.
	 *
	 * A série sempre vem completa e zerada quando não há compromisso, então sem
	 * esta checagem a tela desenharia seis barras vazias — um gráfico que diz
	 * "zero" sem dizer por quê.
	 */
	const isEmpty = computed(
		() => !loading.value && !error.value && series.value.length > 0 && peakInCents.value === 0
	);

	/** Largura da barra do mês, de 0 a 100, relativa ao mês mais pesado. */
	function barPercent(entry) {
		const committed = entry?.committedInCents ?? 0;
		if (peakInCents.value <= 0 || committed <= 0) return 0;

		return Math.max(MIN_BAR_PERCENT, Math.round((committed / peakInCents.value) * 100));
	}

	return {
		months,
		series,
		loading,
		error,
		load,
		totalCommittedInCents,
		totalInvoicesInCents,
		totalDebitsInCents,
		peakInCents,
		isEmpty,
		barPercent,
	};
}
