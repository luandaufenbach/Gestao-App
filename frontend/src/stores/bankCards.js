import { ref, computed } from "vue";
/**
 * Imports nomeados de propósito, e não `import * as api`.
 *
 * Com o namespace, uma função removida de api.js vira só `undefined` em tempo de
 * execução: o build passa e o erro aparece quando alguém clica. Foi assim que o
 * favorito quebrou — `updateBankCard` tinha sido apagada como código morto.
 * Com imports nomeados, o próprio build acusa que o export não existe.
 */
import { getBankCards, createBankCard, updateBankCard, deleteBankCard } from "../services/api";

/**
 * Store de cartões — singleton, pelo mesmo motivo da store de categorias.
 *
 * O formulário de transação, o card de Faturas e a lista "Meus cartões" olham
 * para a mesma lista: cadastrar um cartão em um lugar o disponibiliza nos
 * outros sem recarregar a página, e um único GET atende os três.
 */
const cards = ref([]);
const loading = ref(false);
const error = ref("");

let inFlight = null;

/**
 * Mesma ordem do backend: favorito primeiro, depois os mais recentes.
 *
 * Reordenar aqui evita um GET a cada estrela marcada ou cartão criado — a lista
 * local segue a mesma regra que o servidor aplicaria.
 */
function sortCards(list) {
	return [...list].sort(
		(a, b) =>
			Number(Boolean(b.starred)) - Number(Boolean(a.starred)) ||
			new Date(b.createdAt) - new Date(a.createdAt)
	);
}

async function load({ force = false } = {}) {
	if (!force && (cards.value.length > 0 || inFlight)) {
		return inFlight ?? cards.value;
	}

	loading.value = true;
	error.value = "";

	inFlight = getBankCards()
		.then((data) => {
			cards.value = Array.isArray(data) ? sortCards(data) : [];
			return cards.value;
		})
		.catch((err) => {
			error.value = err.displayMessage ?? "Erro ao carregar cartões";
			cards.value = [];
			throw err;
		})
		.finally(() => {
			loading.value = false;
			inFlight = null;
		});

	return inFlight;
}

async function create(payload) {
	const created = await createBankCard(payload);

	// Um cartão criado já com estrela tira a dos outros, como no backend.
	const others = created.starred
		? cards.value.map((card) => ({ ...card, starred: false }))
		: cards.value;

	cards.value = sortCards([...others, created]);
	return created;
}

/**
 * Marca ou desmarca o favorito.
 *
 * O backend garante que só um cartão fica com estrela; a lista local replica a
 * regra para que a troca apareça na hora em todas as telas.
 */
async function setStarred(id, starred) {
	const updated = await updateBankCard(id, { starred });

	cards.value = sortCards(
		cards.value.map((card) => {
			if (card._id === id) return updated;
			return starred ? { ...card, starred: false } : card;
		})
	);

	return updated;
}

async function remove(id) {
	await deleteBankCard(id);
	cards.value = cards.value.filter((card) => card._id !== id);
}

/** Limpa o cache no logout, para não vazar dados entre contas. */
function reset() {
	cards.value = [];
	error.value = "";
	inFlight = null;
}

export function useBankCards() {
	const creditCards = computed(() => cards.value.filter((card) => card.type === "credit"));

	return { cards, creditCards, loading, error, load, create, setStarred, remove, reset };
}
