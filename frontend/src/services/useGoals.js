import { ref } from "vue";
// Imports nomeados, não `import * as api` — ver a razão em stores/bankCards.js.
import { getGoals, createGoal, updateGoal, deleteGoal } from "./api";

/**
 * Composable de metas.
 *
 * Assim como em useTransactions, o `onMounted` embutido foi removido: quem usa
 * decide quando carregar. Antes, Goals.vue acabava disparando duas requisições
 * — uma pelo onMounted interno do composable e outra pelo onMounted da view.
 */
export function useGoals() {
	const goals = ref([]);
	const loading = ref(false);
	const error = ref("");

	async function loadGoals() {
		loading.value = true;
		error.value = "";

		try {
			const data = await getGoals();
			goals.value = Array.isArray(data) ? data : [];
		} catch (err) {
			error.value = err.displayMessage ?? "Erro ao carregar metas";
			goals.value = [];
		} finally {
			loading.value = false;
		}
	}

	async function createNew(payload) {
		const created = await createGoal(payload);
		goals.value = [created, ...goals.value];
		return created;
	}

	async function update(id, payload) {
		const updated = await updateGoal(id, payload);
		const index = goals.value.findIndex((goal) => goal._id === id);
		if (index !== -1) goals.value[index] = updated;
		return updated;
	}

	async function remove(id) {
		await deleteGoal(id);
		goals.value = goals.value.filter((goal) => goal._id !== id);
	}

	return { goals, loading, error, loadGoals, createNew, update, remove };
}
