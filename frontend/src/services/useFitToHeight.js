import { ref, toValue, onMounted, onBeforeUnmount, nextTick } from "vue";

/** Folga em px para absorver o arredondamento de `clientHeight`. */
const SUBPIXEL_SLACK = 1;

/**
 * Corta uma lista na quantidade de itens que cabe na altura disponível.
 *
 * MOTIVO: no dashboard os cards vivem em linhas de grid, e o grid estica todos
 * os cards da linha até a altura do mais alto. O card mais baixo ficava com um
 * bloco de branco embaixo do conteúdo. Como essa altura só existe em runtime
 * (depende de quantas categorias, faturas ou linhas de saldo o mês tem), não dá
 * para escolher um número fixo de itens no template.
 *
 * A medição é da altura útil do container e da altura real da primeira linha
 * renderizada. Cortar a lista nunca a faz somar mais que o espaço já
 * disponível, então o ResizeObserver converge em vez de se realimentar.
 *
 * @param {import("vue").Ref<HTMLElement|null>} rootRef - card inteiro; é ele
 *   que muda de tamanho quando a linha do grid muda.
 * @param {import("vue").Ref<HTMLElement|null>} listRef - container dos itens,
 *   que deve ocupar a altura livre (flex-1 + min-h-0 + overflow-hidden).
 */
export function useFitToHeight(rootRef, listRef, options = {}) {
	const {
		/** Espaçamento entre os itens, em px (o `gap-*` do container). */
		gap = 8,
		/** Altura de linha usada só no primeiro render, antes de haver o que medir. */
		fallbackRowHeight = 58,
		/** Quantos itens mostrar antes da primeira medição. */
		initial = 5,
		/** Desliga o ajuste por conta do chamador (ex.: a lista fora do dashboard). */
		enabled = true,
		/**
		 * Largura mínima para o ajuste valer, casada com o `md:` que dá altura
		 * própria aos containers. Abaixo dela o card cresce com o conteúdo e não
		 * existe "altura disponível" para preencher: medir ali só encontra a
		 * altura dos itens que já estão na tela, e o resultado fica onde estava
		 * por acidente da medição, não por decisão. 0 desliga o corte por largura.
		 */
		minWidth = 768,
	} = options;

	const media = minWidth ? window.matchMedia(`(min-width: ${minWidth}px)`) : null;

	/** Com o ajuste desligado, `capacity` é Infinity e o `.slice()` do chamador não corta. */
	const capacity = ref(media && !media.matches ? Infinity : initial);
	let observer = null;

	function isActive() {
		return toValue(enabled) && (media ? media.matches : true);
	}

	/**
	 * Passo vertical de uma linha: altura real + gap real, os dois fracionários.
	 *
	 * MOTIVO: `offsetHeight` é arredondado para inteiro, mas `clientHeight`
	 * reflete a soma das alturas reais. Com entrelinha relativa (14px × 1,45 e
	 * 12px × 1,4) a linha de transação mede 58,7px e `offsetHeight` devolve 59:
	 * o divisor fica maior que o passo real e a conta corta uma linha. Onde o
	 * container tem altura própria isso só desperdiça espaço, mas onde a altura
	 * vem do conteúdo vira realimentação — 5 itens devolvem 4, 4 devolvem 3, até
	 * sobrar um.
	 *
	 * A distância entre o topo de duas linhas dá o passo inteiro de uma vez, e
	 * dele sai o gap real; assim a conta não depende de a opção `gap` bater com
	 * o `gap-*` que o container de fato usa.
	 */
	function measureStep() {
		const first = listRef.value.firstElementChild;
		if (!first) return { step: fallbackRowHeight + gap, rowGap: gap };

		const firstRect = first.getBoundingClientRect();
		const rowHeight = firstRect.height || fallbackRowHeight;
		const second = first.nextElementSibling;

		// Com uma linha só não há distância para medir. E se o passo não for
		// maior que a linha, as duas não estão empilhadas (lado a lado, ordem
		// invertida) e a medida não serve.
		if (!second) return { step: rowHeight + gap, rowGap: gap };

		const step = second.getBoundingClientRect().top - firstRect.top;
		if (step <= rowHeight) return { step: rowHeight + gap, rowGap: gap };

		return { step, rowGap: step - rowHeight };
	}

	function measure() {
		if (!listRef.value) return;

		if (!isActive()) {
			capacity.value = Infinity;
			return;
		}

		const available = listRef.value.clientHeight;
		if (!available) return;

		const { step, rowGap } = measureStep();

		// O último item não tem gap depois dele, daí o + rowGap no numerador:
		// para n linhas, `available + rowGap` é exatamente n × step.
		//
		// SUBPIXEL_SLACK absorve o arredondamento de `clientHeight` (até 0,5px)
		// e o erro da divisão em ponto flutuante. É sempre menor que um passo de
		// linha, então nunca devolve n + 1.
		capacity.value = Math.max(1, Math.floor((available + rowGap + SUBPIXEL_SLACK) / step));
	}

	/** Mede depois que o DOM refletir a mudança (recarga de dados, troca de aba). */
	async function remeasure() {
		await nextTick();
		measure();
	}

	onMounted(async () => {
		await remeasure();

		// Atravessar o breakpoint muda se há altura própria para medir, e o
		// ResizeObserver do card não é criado quando o ajuste nasce desligado.
		media?.addEventListener("change", remeasure);

		if (!toValue(enabled) || !rootRef.value) return;

		observer = new ResizeObserver(measure);
		observer.observe(rootRef.value);
	});

	onBeforeUnmount(() => {
		observer?.disconnect();
		media?.removeEventListener("change", remeasure);
	});

	return { capacity, measure, remeasure };
}
