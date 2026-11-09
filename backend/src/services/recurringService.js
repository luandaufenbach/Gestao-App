const Transaction = require("../models/Transaction");
const { toMonthKey } = require("../utils/date");

/**
 * Detecção de assinaturas recorrentes (ROADMAP 3.4).
 *
 * A pergunta: quanto do seu mês já está comprometido com cobrança que se
 * repete sozinha e que você provavelmente esqueceu que assinou.
 *
 * Não há campo "é assinatura" em lugar nenhum — isto é inferência sobre o
 * histórico que já existe. Por isso cada regra abaixo é conservadora: errar
 * dizendo "você tem uma assinatura de R$ 300" que não existe é pior que deixar
 * uma passar.
 */

/** Meses de histórico examinados. */
const JANELA_EM_MESES = 12;

/**
 * Mínimo de cobranças para chamar de assinatura.
 *
 * Duas não bastam: comprar no mesmo mercado em janeiro e em fevereiro pelo
 * mesmo valor é coincidência comum. Três em meses distintos já é padrão.
 */
const MINIMO_DE_COBRANCAS = 3;

/**
 * Variação de valor tolerada em relação à mediana.
 *
 * Não é zero porque assinatura reajusta: a Netflix sobe de R$ 44,90 para
 * R$ 49,90 e continua sendo a mesma assinatura. Acima disto já é outra coisa —
 * conta de luz varia muito mais que isso e não é assinatura.
 */
const VARIACAO_TOLERADA = 0.25;

/**
 * Quanto tempo sem cobrar antes de considerar encerrada.
 *
 * Dois meses, e não um: a cobrança do dia 28 pode cair no dia 2 do mês
 * seguinte, e um corte de um mês marcaria como cancelada uma assinatura viva.
 */
const MESES_ATE_CONSIDERAR_ENCERRADA = 2;

/**
 * Reduz a descrição ao que identifica o serviço.
 *
 * Tira acento, caixa, pontuação e NÚMEROS. Os números são o ponto: "Spotify
 * 11/2026", "Spotify nov" e "Spotify" são a mesma assinatura, e sem isso cada
 * mês viraria um grupo de um só.
 */
function chaveDaDescricao(descricao) {
	return String(descricao ?? "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/\d+/g, " ")
		.replace(/[^a-z\s]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function mediana(valores) {
	const ordenados = [...valores].sort((a, b) => a - b);
	const meio = Math.floor(ordenados.length / 2);
	return ordenados.length % 2
		? ordenados[meio]
		: Math.round((ordenados[meio - 1] + ordenados[meio]) / 2);
}

/** Quantas vezes o valor mais repetido aparece. */
function repeticoesDoValorMaisComum(valores) {
	const contagem = new Map();
	for (const v of valores) contagem.set(v, (contagem.get(v) ?? 0) + 1);
	return Math.max(...contagem.values());
}

/** Distância em meses entre duas chaves "AAAA-MM". */
function distanciaEmMeses(de, ate) {
	const [a1, m1] = de.split("-").map(Number);
	const [a2, m2] = ate.split("-").map(Number);
	return (a2 - a1) * 12 + (m2 - m1);
}

/**
 * Decide se um grupo de lançamentos é assinatura.
 *
 * Devolve o resumo, ou `null` quando o grupo não passa em alguma regra.
 */
function avaliarGrupo(lancamentos, mesAtual) {
	// Um mês com duas cobranças iguais conta uma vez: o que caracteriza
	// assinatura é repetir ao longo dos MESES, não dentro do mês.
	const porMes = new Map();
	for (const t of lancamentos) {
		const mes = toMonthKey(t.date);
		if (!porMes.has(mes)) porMes.set(mes, t);
	}

	const meses = [...porMes.keys()].sort();
	if (meses.length < MINIMO_DE_COBRANCAS) return null;

	const valores = meses.map((m) => porMes.get(m).valueInCents);
	const valorMensal = mediana(valores);
	if (valorMensal <= 0) return null;

	// Todos os valores precisam orbitar a mediana. Um único mês destoante
	// derruba o grupo, porque é sinal de que não é a mesma cobrança.
	const estavel = valores.every(
		(v) => Math.abs(v - valorMensal) / valorMensal <= VARIACAO_TOLERADA
	);
	if (!estavel) return null;

	/**
	 * E pelo menos metade dos meses tem que ter o valor EXATAMENTE igual.
	 *
	 * MOTIVO, achado conferindo com dados de verdade: seis meses de "Mercado
	 * 12/11", "Mercado 09/12"... viram um grupo só, porque a normalização tira
	 * os números. Gastando entre R$ 600 e R$ 750, tudo cabe na banda de 25% e o
	 * app anunciava "assinatura de R$ 675". Assinatura cobra o MESMO valor; o
	 * que varia todo mês é compra, por mais regular que seja.
	 *
	 * A banda de cima continua, para o reajuste: Netflix 44,90 / 44,90 / 49,90
	 * tem dois meses idênticos de três e passa. Mercado não tem nenhum.
	 */
	const repetidos = repeticoesDoValorMaisComum(valores);
	if (repetidos < Math.ceil(meses.length / 2)) return null;

	/**
	 * A cadência precisa ser mensal. Sem esta regra, três compras no mesmo
	 * lugar em janeiro, maio e setembro virariam "assinatura".
	 *
	 * Aceita buraco de um mês: cobrança que pula por falha no cartão e volta
	 * continua sendo a mesma assinatura.
	 */
	const mensal = meses
		.slice(1)
		.every((mes, i) => distanciaEmMeses(meses[i], mes) <= MESES_ATE_CONSIDERAR_ENCERRADA);
	if (!mensal) return null;

	const ultimoMes = meses[meses.length - 1];
	const ultima = porMes.get(ultimoMes);
	const primeira = porMes.get(meses[0]);

	return {
		/** A descrição como o usuário escreveu da última vez, não a normalizada. */
		description: ultima.description,
		/**
		 * O valor da ÚLTIMA cobrança, não a mediana: depois de um reajuste, o
		 * que compromete o mês que vem é o preço novo. Com a mediana, a Netflix
		 * reajustada apareceria pelo preço velho.
		 */
		valueInCents: ultima.valueInCents,
		occurrences: meses.length,
		firstChargeAt: primeira.date,
		lastChargeAt: ultima.date,
		type: ultima.type,
		category: ultima.category ?? null,
		bankCard: ultima.bankCard ?? null,
		/** Falsa quando a última cobrança é velha demais: provavelmente cancelada. */
		active: distanciaEmMeses(ultimoMes, mesAtual) <= MESES_ATE_CONSIDERAR_ENCERRADA,
	};
}

/**
 * Procura assinaturas no histórico recente do usuário.
 *
 * @returns {Promise<{ subscriptions: object[], monthlyTotalInCents: number, windowInMonths: number }>}
 */
async function detectRecurringCharges(userId, referencia = new Date()) {
	const inicio = new Date(
		Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth() - (JANELA_EM_MESES - 1), 1)
	);

	/**
	 * Só despesa: receita que se repete é salário, e `savings` é transferência
	 * para a própria reserva — nenhum dos dois é assinatura.
	 *
	 * Parcelamento fica de fora pelo `installmentGroupId`: uma compra em 12x
	 * tem a cara exata de uma assinatura, com a diferença decisiva de que
	 * acaba. O que ela compromete por mês já aparece na projeção (1.1).
	 */
	const lancamentos = await Transaction.find({
		user: userId,
		type: { $in: ["debit", "credit"] },
		date: { $gte: inicio },
		installmentGroupId: null,
	})
		.select("description valueInCents date type category bankCard")
		.populate("category", "name color")
		.populate("bankCard", "name lastFourDigits")
		.lean();

	const grupos = new Map();
	for (const t of lancamentos) {
		const chave = chaveDaDescricao(t.description);
		// Descrição que vira string vazia depois da normalização ("123", "---")
		// não identifica serviço nenhum.
		if (!chave) continue;
		if (!grupos.has(chave)) grupos.set(chave, []);
		grupos.get(chave).push(t);
	}

	const mesAtual = toMonthKey(referencia);
	const assinaturas = [];
	for (const grupo of grupos.values()) {
		const resumo = avaliarGrupo(grupo, mesAtual);
		if (resumo) assinaturas.push(resumo);
	}

	// Maior primeiro: é o que o usuário quer ver no topo.
	assinaturas.sort((a, b) => b.valueInCents - a.valueInCents);

	// O total é só das ativas. Somar cancelada inflaria o comprometido do mês.
	const monthlyTotalInCents = assinaturas
		.filter((a) => a.active)
		.reduce((total, a) => total + a.valueInCents, 0);

	return {
		subscriptions: assinaturas,
		monthlyTotalInCents,
		windowInMonths: JANELA_EM_MESES,
	};
}

module.exports = {
	detectRecurringCharges,
	// Exportados para o teste cobrir a normalização sem passar pelo banco.
	chaveDaDescricao,
	MINIMO_DE_COBRANCAS,
	VARIACAO_TOLERADA,
};
