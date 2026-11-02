import { ref } from "vue";
import { exportAccount, deleteAccount } from "./api";
import { useFormatters } from "./useFormatters";

/**
 * Exportar e excluir a própria conta (ROADMAP 0.6).
 *
 * Estado de uma tela só, então mora aqui e não em `stores/`: nenhum outro
 * componente precisa saber que uma exportação está em curso.
 */

/** Mensagens de limite. O erro genérico do servidor não diz quanto esperar. */
const EXPORT_RATE_LIMIT_MESSAGE =
	"Você já baixou seus dados 5 vezes nesta última hora, que é o limite. Tente de novo mais tarde — o arquivo que você já baixou continua válido.";

const DELETE_RATE_LIMIT_MESSAGE =
	"Limite de 3 tentativas por hora atingido. Sua conta NÃO foi excluída. Tente de novo mais tarde.";

export function useAccount() {
	const { formatDateForInput } = useFormatters();

	const exporting = ref(false);
	const exportError = ref("");
	/** Nome do arquivo entregue na última exportação, ou "". */
	const exportedFilename = ref("");

	const deleting = ref(false);
	const deleteError = ref("");

	/**
	 * Nome de reserva, no mesmo formato que o backend usa.
	 *
	 * Vale sempre que o `Content-Disposition` não chega ao JavaScript — o que
	 * acontece entre origens diferentes sem `Access-Control-Expose-Headers`.
	 * A data sai do formatador do projeto (UTC), não de um `new Date()`
	 * montado à mão.
	 */
	const fallbackFilename = () => `gestao-app-export-${formatDateForInput(new Date())}.json`;

	/**
	 * Entrega o blob ao navegador como arquivo.
	 *
	 * O clique no link precisa acontecer com o elemento DENTRO do documento, em
	 * Firefox; e a URL do objeto segura o blob inteiro na memória até ser
	 * revogada, por isso a limpeza não é opcional.
	 */
	function saveBlobAsFile(blob, filename) {
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");

		link.href = url;
		link.download = filename;
		link.rel = "noopener";
		document.body.appendChild(link);
		link.click();
		link.remove();

		URL.revokeObjectURL(url);
	}

	/** Baixa a exportação. Resolve para `true` quando o arquivo foi entregue. */
	async function downloadExport() {
		if (exporting.value) return false;

		exporting.value = true;
		exportError.value = "";
		exportedFilename.value = "";

		try {
			const { blob, filename } = await exportAccount();
			const name = filename || fallbackFilename();

			saveBlobAsFile(blob, name);
			exportedFilename.value = name;
			return true;
		} catch (err) {
			exportError.value =
				err.status === 429
					? EXPORT_RATE_LIMIT_MESSAGE
					: (err.displayMessage ?? "Não foi possível gerar a exportação.");
			return false;
		} finally {
			exporting.value = false;
		}
	}

	/**
	 * Exclui a conta. Resolve para `true` SÓ quando o servidor confirmou.
	 *
	 * Não mexe na sessão nem na navegação de propósito: quem chama precisa
	 * descartar a sessão no `true` (o token já está morto no servidor) e seguir
	 * na tela no `false` — senha errada volta aqui como 401 com a conta intacta.
	 */
	async function removeAccount(password) {
		if (deleting.value) return false;

		deleting.value = true;
		deleteError.value = "";

		try {
			await deleteAccount({ password });
			return true;
		} catch (err) {
			deleteError.value =
				err.status === 429
					? DELETE_RATE_LIMIT_MESSAGE
					: (err.displayMessage ?? "Não foi possível excluir a conta.");
			return false;
		} finally {
			deleting.value = false;
		}
	}

	return {
		exporting,
		exportError,
		exportedFilename,
		downloadExport,
		deleting,
		deleteError,
		removeAccount,
	};
}
