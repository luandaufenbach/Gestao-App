const { asaasApiKey, asaasBaseUrl } = require("../config/env");
const AppError = require("../utils/AppError");

/**
 * Cliente do Asaas (ROADMAP 2.2).
 *
 * Só o que a assinatura por Pix exige: criar cliente, criar assinatura,
 * cancelar. Nada de embrulhar a API inteira — o que não é usado não é mantido.
 *
 * Documentação: https://docs.asaas.com/
 *   POST   /v3/customers      — name e cpfCnpj obrigatórios
 *   POST   /v3/subscriptions  — customer, billingType, value, nextDueDate, cycle
 *   DELETE /v3/subscriptions/{id}
 *
 * A autenticação é o header `access_token` com a chave pura, sem "Bearer".
 * Chave de sandbox não vale em produção e vice-versa, por isso a base muda
 * junto (ver `asaasBaseUrl` em config/env.js).
 */

/** Centavos inteiros -> número decimal em reais, que é o que o Asaas aceita. */
const toReais = (valueInCents) => Number((valueInCents / 100).toFixed(2));

/** Data -> "YYYY-MM-DD", o formato do `nextDueDate`. Sempre em UTC (CLAUDE.md). */
function toDueDate(date) {
	return date.toISOString().slice(0, 10);
}

async function request(path, { method = "GET", body } = {}) {
	if (!asaasApiKey) {
		// Falha explícita em vez de uma requisição que o Asaas recusaria com 401:
		// a causa real é configuração ausente, e a mensagem precisa dizer isso.
		throw AppError.internal("Pagamento indisponível: ASAAS_API_KEY não configurada.");
	}

	let response;

	try {
		response = await fetch(`${asaasBaseUrl}${path}`, {
			method,
			headers: {
				access_token: asaasApiKey,
				"Content-Type": "application/json",
				// A documentação pede um User-Agent que identifique a aplicação.
				"User-Agent": "GestaoApp/1.0",
			},
			body: body ? JSON.stringify(body) : undefined,
		});
	} catch {
		// Rede fora do ar não é culpa de quem está assinando. A causa não vai na
		// resposta: `details` é devolvido ao cliente pelo errorHandler.
		throw AppError.internal("Não foi possível falar com o provedor de pagamento.");
	}

	const payload = await response.json().catch(() => null);

	if (!response.ok) {
		/**
		 * O Asaas devolve { errors: [{ code, description }] }. A descrição é
		 * escrita para o lojista, não para o cliente final, mas é melhor que um
		 * "erro desconhecido" — e sem ela fica impossível depurar em produção.
		 */
		const description = payload?.errors?.[0]?.description;

		throw new AppError(
			response.status === 400 ? 400 : 502,
			description || "O provedor de pagamento recusou a requisição."
		);
	}

	return payload;
}

/**
 * Cria o cliente no Asaas.
 *
 * O CPF é obrigatório pela API — não é escolha nossa. É também o motivo de a
 * tela de assinatura pedir o documento, e de a política de privacidade precisar
 * declarar esse compartilhamento.
 *
 * `externalReference` guarda o id do nosso usuário: é o que permite reconciliar
 * manualmente no painel do Asaas quando algo destoa.
 */
function createCustomer({ name, email, cpfCnpj, userId }) {
	return request("/customers", {
		method: "POST",
		body: { name, email, cpfCnpj, externalReference: String(userId) },
	});
}

/**
 * Cria a assinatura recorrente por Pix.
 *
 * As cobranças seguintes são geradas pelo próprio Asaas ao longo da
 * recorrência; não cabe a nós agendá-las.
 */
function createSubscription({ customerId, plan, firstDueDate, userId }) {
	return request("/subscriptions", {
		method: "POST",
		body: {
			customer: customerId,
			billingType: "PIX",
			value: toReais(plan.priceInCents),
			nextDueDate: toDueDate(firstDueDate),
			cycle: plan.cycle,
			description: `${plan.name} — ${plan.description}`,
			externalReference: String(userId),
		},
	});
}

/**
 * Encerra a recorrência.
 *
 * Remove as cobranças pendentes e mantém as já pagas, que é exatamente o
 * comportamento que o 2.4 exige: quem cancela no dia 2 usa o mês inteiro.
 */
function cancelSubscription(subscriptionId) {
	return request(`/subscriptions/${subscriptionId}`, { method: "DELETE" });
}

module.exports = { createCustomer, createSubscription, cancelSubscription, toReais, toDueDate };
