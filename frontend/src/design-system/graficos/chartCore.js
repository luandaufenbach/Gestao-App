/**
 * Auxiliares compartilhados dos gráficos — porte de `graficos/components/base/
 * ChartCore.jsx` da skill `gestaoapp-design`.
 *
 * O que mudou do original, e só isto:
 *   - os três componentes React do arquivo (TrendGlyph, ChartTooltip, SrTable)
 *     viraram markup dentro dos `.vue`, porque aqui não há JSX;
 *   - `useMeasure` virou `useElementWidth`, um composable do Vue com o mesmo
 *     ResizeObserver e o mesmo valor inicial;
 *   - `pointerIndex`/`bandIndex` recebem o retângulo do elemento em vez de
 *     lerem `e.currentTarget`, para funcionarem com o `@pointermove` do Vue.
 *
 * As FUNÇÕES DE CÁLCULO são cópia literal: escala, ticks, formatação pt-BR e
 * geometria de barra e linha. É o que mantém o gráfico idêntico ao da skill e
 * permite comparar os dois arquivos lado a lado quando ela for atualizada.
 */
import { ref, onMounted, onBeforeUnmount } from "vue";

export const CHART_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
	"var(--chart-6)",
	"var(--chart-7)",
	"var(--chart-8)",
];

/** Cor da série N, respeitando a ordem fixa da paleta categórica. */
export function seriesColor(index, color) {
	return color || CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * Largura do elemento, observada. O gráfico é SVG com width em pixels, então
 * ele precisa do número — não dá para resolver só em CSS.
 */
export function useElementWidth(initial = 560) {
	const el = ref(null);
	const width = ref(initial);
	let observer = null;

	const measure = () => {
		if (!el.value) return;
		const value = Math.round(el.value.getBoundingClientRect().width);
		if (value > 0) width.value = value;
	};

	onMounted(() => {
		measure();
		if (typeof ResizeObserver === "undefined") return;
		observer = new ResizeObserver(measure);
		observer.observe(el.value);
	});

	onBeforeUnmount(() => observer?.disconnect());

	return { el, width };
}

/** Ticks "redondos" pela escada 1 / 2 / 5 × 10^k, cobrindo [min, max]. */
export function niceTicks(min, max, count = 4) {
	if (!isFinite(min) || !isFinite(max)) {
		min = 0;
		max = 1;
	}
	if (min === max) max = min === 0 ? 1 : min * 1.2;

	const rough = (max - min) / count;
	const magnitude = 10 ** Math.floor(Math.log10(rough));
	const error = rough / magnitude;
	const step = (error >= 7.07 ? 10 : error >= 3.16 ? 5 : error >= 1.41 ? 2 : 1) * magnitude;

	const lo = Math.floor(min / step + 1e-9) * step;
	const hi = Math.ceil(max / step - 1e-9) * step;

	const out = [];
	for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v / step) * step);
	return out;
}

const FORMATTERS = {};
const nf = (options) => {
	const key = JSON.stringify(options);
	return FORMATTERS[key] || (FORMATTERS[key] = new Intl.NumberFormat("pt-BR", options));
};

/**
 * Formatação pt-BR do sistema. Aceita o nome de um formato ou uma função.
 *
 * ATENÇÃO ao usar no app: estes formatos recebem o valor na unidade final —
 * `currency` espera REAIS, não centavos. Como todo valor do projeto trafega em
 * centavos, as telas passam uma FUNÇÃO vinda de `useFormatters`, que é onde a
 * divisão por 100 acontece.
 */
export function formatValue(value, format) {
	if (value == null || (typeof value === "number" && Number.isNaN(value))) return "—";
	if (typeof format === "function") return format(value);
	if (typeof value !== "number") return String(value);

	switch (format) {
		case "percent":
			return nf({ maximumFractionDigits: 1 }).format(value) + "%";
		case "pp":
			return nf({ maximumFractionDigits: 1 }).format(value) + " pp";
		case "compact":
			return nf({ notation: "compact", maximumFractionDigits: 1 }).format(value);
		case "currency":
			return nf({ style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
		case "currencyCompact":
			return "R$ " + nf({ notation: "compact", maximumFractionDigits: 1 }).format(value);
		case "hours":
			return nf({ maximumFractionDigits: 1 }).format(value) + " h";
		case "days":
			return (
				nf({ maximumFractionDigits: 1 }).format(value) +
				(Math.abs(value) === 1 ? " dia" : " dias")
			);
		case "decimal":
			return nf({ minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
		default:
			return nf({ maximumFractionDigits: 1 }).format(value);
	}
}

/** Quantos ticks cabem na altura dada. */
export function tickCount(height) {
	return Math.max(2, Math.min(6, Math.round((height - 40) / 46)));
}

/** Largura aproximada de um texto, para dimensionar a margem do eixo. */
export function textWidth(text, px = 11) {
	return String(text).length * px * 0.56;
}

/** De quantos em quantos rótulos do eixo X desenhar, para não embolarem. */
export function tickStep(n, width, gap = 46) {
	const fit = Math.max(1, Math.floor(width / gap));
	return Math.max(1, Math.ceil(n / fit));
}

/** Caminho de barra com cantos arredondados só do lado que importa. */
export function barPath(x, y, w, h, r, dir) {
	if (!(w > 0) || !(h > 0)) return "";

	r = Math.max(0, Math.min(r || 0, w / 2, h));

	if (!r || dir === "none") {
		return `M${x},${y}H${x + w}V${y + h}H${x}Z`;
	}
	if (dir === "down") {
		return `M${x},${y}H${x + w}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x + r}Q${x},${y + h} ${x},${y + h - r}Z`;
	}
	if (dir === "all") {
		return `M${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x + r}Q${x},${y + h} ${x},${y + h - r}V${y + r}Q${x},${y} ${x + r},${y}Z`;
	}
	return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/**
 * Qual coluna está sob o ponteiro. Recebe o retângulo pronto porque no Vue o
 * handler não tem o `currentTarget` do React à mão no mesmo formato.
 */
export function bandIndex(clientX, rect, left, innerWidth, n) {
	const x = clientX - rect.left - left;
	if (x < 0 || x > innerWidth) return null;
	return Math.max(0, Math.min(n - 1, Math.floor((x / innerWidth) * n)));
}
