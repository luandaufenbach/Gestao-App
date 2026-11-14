import { ref, computed } from "vue";
import { getMySubscription, createSubscription, cancelSubscription } from "../services/api";

/**
 * Store de assinatura — singleton, como as de categorias e cartões.
 *
 * O estado precisa ser compartilhado porque três lugares perguntam a mesma
 * coisa: a tela de planos, o aviso de recurso pago e o menu da conta. Com
 * estado local em cada um, assinar numa tela deixaria as outras mentindo até
 * a próxima recarga da página.
 */
const state = ref(null);
const loading = ref(false);
const error = ref("");

let inFlight = null;

async function load({ force = false } = {}) {
	if (!force && (state.value || inFlight)) return inFlight ?? state.value;

	loading.value = true;
	error.value = "";

	inFlight = getMySubscription()
		.then((data) => {
			state.value = data;
			return data;
		})
		.catch((err) => {
			error.value = err.displayMessage ?? "Erro ao carregar a assinatura";
			state.value = null;
			throw err;
		})
		.finally(() => {
			loading.value = false;
			inFlight = null;
		});

	return inFlight;
}

/**
 * Cria a assinatura e devolve a cobrança.
 *
 * NÃO marca acesso liberado: o Pix nasce em aberto e quem libera é o webhook
 * de pagamento. Mentir aqui mostraria "Pro" para quem ainda não pagou, e a
 * primeira tela paga devolveria 402 logo em seguida.
 */
async function subscribe(cpfCnpj) {
	const charge = await createSubscription(cpfCnpj);
	await load({ force: true });
	return charge;
}

async function cancel() {
	const result = await cancelSubscription();
	await load({ force: true });
	return result;
}

/** Limpa no logout, para não vazar o estado de uma conta para a seguinte. */
function reset() {
	state.value = null;
	error.value = "";
	inFlight = null;
}

export function useSubscription() {
	const hasPaidAccess = computed(() => state.value?.hasPaidAccess === true);
	const status = computed(() => state.value?.status ?? "none");
	const validUntil = computed(() => state.value?.validUntil ?? null);
	const catalog = computed(() => state.value?.catalog ?? null);

	/** Cobrança criada e ainda não paga: a tela de planos mostra o Pix pendente. */
	const isAwaitingPayment = computed(() => status.value === "past_due" && !hasPaidAccess.value);

	return {
		state,
		loading,
		error,
		hasPaidAccess,
		status,
		validUntil,
		catalog,
		isAwaitingPayment,
		load,
		subscribe,
		cancel,
		reset,
	};
}
