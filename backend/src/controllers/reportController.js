const mongoose = require("mongoose");

const Transaction = require("../models/Transaction");
const asyncHandler = require("../utils/asyncHandler");
const { toMonthKey, monthKeyLabel } = require("../utils/date");

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

/** Janela padrão quando o cliente não pede tamanho. O validador aceita 3 a 12. */
const DEFAULT_MONTHS = 6;

/** Chave e cor das despesas sem categoria, iguais às do breakdown do dashboard. */
const NO_CATEGORY_KEY = "sem-categoria";
const NO_CATEGORY_COLOR = "#94a3b8";

/**
 * RELATÓRIO MENSAL (ROADMAP 1.2) — "como foram os últimos meses?"
 *
 * A série é de COMPETÊNCIA, não de caixa. Cada mês soma:
 *
 *   receita   income
 *   despesa   debit + credit, pela DATA DA COMPRA
 *   resultado receita − despesa
 *
 * A compra no crédito conta integralmente no mês em que foi feita, e o
 * `invoice_payment` NÃO entra: ele só quita uma dívida que a compra já
 * registrou. Somar os dois contaria o mesmo dinheiro duas vezes — uma na
 * compra, outra no pagamento da fatura. É a mesma separação que o
 * `dashboardController` documenta em `CASH_EFFECT`: lá o assunto é quanto sai
 * da conta e quando; aqui é quanto a vida custou em cada mês.
 *
 * Por isso o relatório não precisa saber nada de ciclo de fatura. O ciclo
 * responde "quando o dinheiro sai", e é o eixo da projeção (1.1). A pergunta
 * daqui é "quanto eu gastei em setembro", e isso é a data da compra.
 *
 * `savings` e `withdrawal` também ficam fora: são transferência entre bolsos,
 * não alteram patrimônio e inflariam a despesa e a receita do mês.
 *
 * ── Uma agregação, não N ────────────────────────────────────────────────
 *
 * Um `$group` por mês + tipo + categoria resolve a série, a quebra por
 * categoria e os totais da janela de uma vez, no servidor do banco, usando o
 * índice { user, date }. O número de linhas devolvidas é no máximo
 * (meses + 1) × (categorias + 1) — dezenas. A montagem em JavaScript é sobre
 * esse punhado de linhas, não sobre a coleção.
 */

/** As `count` chaves "AAAA-MM" que terminam no mês corrente, em ordem. */
function monthKeysEndingNow(count, now = new Date()) {
	const year = now.getUTCFullYear();
	const monthIndex = now.getUTCMonth();

	return Array.from({ length: count }, (_, index) =>
		toMonthKey(new Date(Date.UTC(year, monthIndex - (count - 1) + index, 1)))
	);
}

/**
 * Variação percentual, arredondada a uma casa.
 *
 * `null` quando o mês anterior foi zero: "subiu 100%" a partir de zero não
 * significa nada, e dividir por zero devolveria Infinity direto para a tela.
 * Quem exibe trata o `null` como "sem base de comparação".
 */
const percentChange = (current, previous) =>
	previous === 0 ? null : Math.round(((current - previous) / previous) * 1000) / 10;

/** Estado acumulado de um mês durante a montagem. */
const emptyMonth = () => ({
	incomeInCents: 0,
	debitExpenseInCents: 0,
	creditExpenseInCents: 0,
	categories: new Map(),
});

const expenseOf = (month) => month.debitExpenseInCents + month.creditExpenseInCents;

const getMonthlyReport = asyncHandler(async (req, res) => {
	const months = req.validatedQuery.months ?? DEFAULT_MONTHS;
	const userId = toObjectId(req.userId);
	const now = new Date();

	const monthKeys = monthKeysEndingNow(months, now);

	/**
	 * O mês ANTERIOR à janela entra na consulta, mas não na resposta.
	 *
	 * É a base de comparação do primeiro mês mostrado. Sem ele, a variação da
	 * primeira linha seria sempre "+100%", como se nada tivesse sido gasto
	 * antes de a janela começar — o que é falso.
	 */
	const baselineKey = toMonthKey(
		new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, 1))
	);

	const windowStart = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, 1, 0, 0, 0, 0)
	);
	// Dia 0 do mês seguinte = último dia do mês corrente, o fim da janela.
	const windowEnd = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)
	);

	const rows = await Transaction.aggregate([
		{
			$match: {
				user: userId,
				// Só o que é receita ou despesa de verdade. Ver o cabeçalho.
				type: { $in: ["income", "debit", "credit"] },
				date: { $gte: windowStart, $lte: windowEnd },
			},
		},
		{
			$group: {
				_id: {
					// Em UTC, como tudo: no fuso local todo dia 1º cairia no mês
					// anterior e a série inteira ficaria deslocada.
					month: { $dateToString: { format: "%Y-%m", date: "$date", timezone: "UTC" } },
					type: "$type",
					category: "$category",
				},
				totalInCents: { $sum: "$valueInCents" },
			},
		},
		/**
		 * Nome e cor da categoria em uma viagem só, como no breakdown do
		 * dashboard. O $lookup roda sobre os GRUPOS, que são dezenas de linhas,
		 * e não sobre as transações.
		 */
		{
			$lookup: {
				from: "categories",
				localField: "_id.category",
				foreignField: "_id",
				as: "category",
			},
		},
		{ $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
		{
			$project: {
				_id: 0,
				month: "$_id.month",
				type: "$_id.type",
				categoryId: "$_id.category",
				category: { $ifNull: ["$category.name", "Sem categoria"] },
				color: { $ifNull: ["$category.color", NO_CATEGORY_COLOR] },
				totalInCents: 1,
			},
		},
	]);

	/**
	 * A série nasce completa e zerada, inclusive o mês-base: mês sem lançamento
	 * continua na lista, porque a tela desenha a série inteira e um buraco
	 * deslocaria o eixo.
	 */
	const state = new Map([baselineKey, ...monthKeys].map((month) => [month, emptyMonth()]));

	/** Totais da janela por categoria, para o comparativo. */
	const categoryTotals = new Map();

	for (const row of rows) {
		const month = state.get(row.month);
		// A agregação cobre exatamente a janela; a guarda é só para nunca somar
		// em um mês que não está na série.
		if (!month) continue;

		if (row.type === "income") {
			month.incomeInCents += row.totalInCents;
			continue;
		}

		if (row.type === "debit") month.debitExpenseInCents += row.totalInCents;
		else month.creditExpenseInCents += row.totalInCents;

		// Débito e crédito somam na MESMA categoria: a pergunta do comparativo é
		// quanto foi para o mercado, não qual meio de pagamento foi usado.
		const key = row.categoryId ? String(row.categoryId) : NO_CATEGORY_KEY;
		const current = month.categories.get(key);

		if (current) {
			current.totalInCents += row.totalInCents;
		} else {
			month.categories.set(key, {
				categoryId: row.categoryId ?? null,
				category: row.category,
				color: row.color,
				totalInCents: row.totalInCents,
			});
		}

		// O mês-base conta na variação, mas não no comparativo por categoria:
		// ele está fora da janela que o usuário pediu.
		if (row.month === baselineKey) continue;

		const total = categoryTotals.get(key);

		if (total) {
			total.totalInCents += row.totalInCents;
		} else {
			categoryTotals.set(key, {
				categoryId: row.categoryId ?? null,
				category: row.category,
				color: row.color,
				totalInCents: row.totalInCents,
				// Alinhado com `series`, posição por posição — é o que o gráfico
				// de barras consome direto, sem procurar mês por chave.
				monthlyInCents: monthKeys.map(() => 0),
			});
		}
	}

	const byTotalDesc = (a, b) =>
		b.totalInCents - a.totalInCents || a.category.localeCompare(b.category);

	const series = monthKeys.map((month, index) => {
		const current = state.get(month);
		const previous = state.get(index === 0 ? baselineKey : monthKeys[index - 1]);

		const incomeInCents = current.incomeInCents;
		const expenseInCents = expenseOf(current);
		const netResultInCents = incomeInCents - expenseInCents;

		const previousExpenseInCents = expenseOf(previous);
		const previousNetResultInCents = previous.incomeInCents - previousExpenseInCents;

		for (const [key, entry] of current.categories) {
			const total = categoryTotals.get(key);
			if (total) total.monthlyInCents[index] = entry.totalInCents;
		}

		return {
			month,
			label: monthKeyLabel(month),

			incomeInCents,
			expenseInCents,
			debitExpenseInCents: current.debitExpenseInCents,
			creditExpenseInCents: current.creditExpenseInCents,
			netResultInCents,

			categories: [...current.categories.values()].sort(byTotalDesc),

			/**
			 * Variação em relação ao mês anterior, que no primeiro item é o mês
			 * de fora da janela. O resultado não tem percentual de propósito: ele
			 * troca de sinal (de −200 para +100 não é "+150%") e a conta diria
			 * qualquer coisa.
			 */
			change: {
				incomeInCents: incomeInCents - previous.incomeInCents,
				incomePercent: percentChange(incomeInCents, previous.incomeInCents),
				expenseInCents: expenseInCents - previousExpenseInCents,
				expensePercent: percentChange(expenseInCents, previousExpenseInCents),
				netResultInCents: netResultInCents - previousNetResultInCents,
			},
		};
	});

	const totalIncomeInCents = series.reduce((sum, item) => sum + item.incomeInCents, 0);
	const totalExpenseInCents = series.reduce((sum, item) => sum + item.expenseInCents, 0);

	return res.json({
		months,
		series,
		totals: {
			incomeInCents: totalIncomeInCents,
			expenseInCents: totalExpenseInCents,
			netResultInCents: totalIncomeInCents - totalExpenseInCents,
			// Média arredondada ao centavo: dinheiro é inteiro, inclusive aqui.
			averageIncomeInCents: Math.round(totalIncomeInCents / months),
			averageExpenseInCents: Math.round(totalExpenseInCents / months),
		},
		categories: [...categoryTotals.values()].sort(byTotalDesc),
	});
});

module.exports = { getMonthlyReport, DEFAULT_MONTHS };
