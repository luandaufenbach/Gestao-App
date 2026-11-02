const mongoose = require("mongoose");

const BankCard = require("../models/BankCard");
const Transaction = require("../models/Transaction");
const asyncHandler = require("../utils/asyncHandler");
const { getMonthRangeUTC } = require("../utils/date");
const { listInvoices } = require("../services/invoiceService");
const { recentCycles, toCycleKey, cycleLabel } = require("../utils/invoiceCycle");

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

/**
 * CONTROLLER REESCRITO — motivo (A3):
 *
 * A versão anterior carregava TODOS os documentos do mês para a memória do
 * Node e somava com forEach/reduce em JavaScript. Isso significa trafegar a
 * coleção inteira pela rede a cada carregamento do dashboard, e o custo cresce
 * linearmente com o histórico do usuário.
 *
 * Agora tudo é feito com aggregation pipeline: o MongoDB soma no servidor,
 * usando os índices, e devolve apenas o número final. Além de bem mais rápido,
 * o uso de memória passa a ser constante.
 *
 * Bônus: o getCategoryBreakdown antigo fazia um Category.findOne() POR
 * categoria (N+1). Aqui um único $lookup resolve.
 */

/** Filtro base: sempre escopado ao usuário e ao intervalo UTC do mês (C2, C5). */
const monthMatch = (userId, query) => {
	const { start, end } = getMonthRangeUTC(query.year, query.month);
	return { user: toObjectId(userId), date: { $gte: start, $lte: end } };
};

/**
 * Resumo do mês, em duas visões que respondem perguntas diferentes.
 *
 * CAIXA — `balanceInCents`, "quanto ainda posso gastar":
 *   receitas − despesas no débito − guardado + resgatado − pagamento de fatura
 *
 *   Compra no crédito NÃO entra aqui. No dia da compra o dinheiro continua na
 *   sua conta; o que você contraiu foi uma dívida. Ele só sai quando a fatura é
 *   paga. Contar os dois momentos somaria o mesmo gasto duas vezes — em julho
 *   pela compra e em agosto pelo pagamento.
 *
 * COMPETÊNCIA — `netResultInCents`, "vivi dentro do que ganho?":
 *   receitas − (débito + crédito)
 *
 *   Aqui a compra no crédito conta integralmente, no mês em que foi feita, e o
 *   pagamento da fatura não conta — ele só quita uma dívida já registrada.
 *
 * As transferências (guardar, resgatar, pagar fatura) nunca entram na
 * competência: não alteram patrimônio, só movem dinheiro de bolso.
 *
 * SALDO ANTERIOR — o que sobrou dos meses passados:
 *
 *   O saldo era calculado só com as transações DENTRO do mês, e por isso
 *   zerava toda virada: quem terminasse agosto com R$ 50 na conta começava
 *   setembro com R$ 0, como se o dinheiro tivesse evaporado. Só que dinheiro
 *   em conta não expira no dia 31.
 *
 *   Agora o saldo é acumulado: soma tudo que aconteceu até o fim do mês
 *   escolhido. O previousBalanceInCents é devolvido à parte para o card
 *   poder exibi-lo como a primeira linha da composição — sem ele, a soma das
 *   linhas não bateria com o total mostrado em cima.
 */

/**
 * Efeito de uma transação no dinheiro DISPONÍVEL em conta.
 *
 * A compra no crédito vale 0: no dia da compra o dinheiro continua na conta.
 * Ela só afeta o caixa quando a fatura é paga, e aí entra como invoice_payment.
 */
const CASH_EFFECT = {
	$switch: {
		branches: [
			{ case: { $in: ["$type", ["income", "withdrawal"]] }, then: "$valueInCents" },
			{
				case: { $in: ["$type", ["debit", "savings", "invoice_payment"]] },
				then: { $multiply: ["$valueInCents", -1] },
			},
		],
		default: 0,
	},
};

const getMonthlyBalance = asyncHandler(async (req, res) => {
	const { start, end } = getMonthRangeUTC(req.validatedQuery.year, req.validatedQuery.month);
	const userId = toObjectId(req.userId);

	const isBeforeMonth = { $lt: ["$date", start] };
	const isInMonth = { $gte: ["$date", start] };

	const sumIf = (condition) => ({
		$sum: { $cond: [{ $and: [isInMonth, condition] }, "$valueInCents", 0] },
	});

	/**
	 * Uma agregação só, não duas: o $match pega tudo até o fim do mês e o
	 * $cond separa o que é anterior do que é do mês. Ida única ao banco, e o
	 * índice { user, date } continua servindo o filtro.
	 */
	const [result] = await Transaction.aggregate([
		{ $match: { user: userId, date: { $lte: end } } },
		{
			$group: {
				_id: null,
				previousBalanceInCents: {
					$sum: { $cond: [isBeforeMonth, CASH_EFFECT, 0] },
				},
				incomeInCents: sumIf({ $eq: ["$type", "income"] }),
				debitExpenseInCents: sumIf({ $eq: ["$type", "debit"] }),
				creditExpenseInCents: sumIf({ $eq: ["$type", "credit"] }),
				savedInCents: sumIf({ $eq: ["$type", "savings"] }),
				withdrawnInCents: sumIf({ $eq: ["$type", "withdrawal"] }),
				invoicePaidInCents: sumIf({ $eq: ["$type", "invoice_payment"] }),
			},
		},
	]);

	const previousBalanceInCents = result?.previousBalanceInCents ?? 0;
	const incomeInCents = result?.incomeInCents ?? 0;
	const debitExpenseInCents = result?.debitExpenseInCents ?? 0;
	const creditExpenseInCents = result?.creditExpenseInCents ?? 0;
	const savedInCents = result?.savedInCents ?? 0;
	const withdrawnInCents = result?.withdrawnInCents ?? 0;
	const invoicePaidInCents = result?.invoicePaidInCents ?? 0;

	// Total gasto no mês, para as categorias e o gráfico (visão de competência).
	const expenseInCents = debitExpenseInCents + creditExpenseInCents;

	// Movimento de caixa do mês, isolado do que veio de trás.
	const monthCashFlowInCents =
		incomeInCents - debitExpenseInCents - savedInCents + withdrawnInCents - invoicePaidInCents;

	return res.json({
		balanceInCents: previousBalanceInCents + monthCashFlowInCents,
		previousBalanceInCents,
		monthCashFlowInCents,

		// Competência continua sendo do mês: "vivi dentro do que ganhei em
		// setembro?" não deve ser respondido com o que sobrou de agosto.
		netResultInCents: incomeInCents - expenseInCents,

		incomeInCents,
		expenseInCents,
		debitExpenseInCents,
		creditExpenseInCents,
		savedInCents,
		withdrawnInCents,
		invoicePaidInCents,

		// Quanto a reserva variou no mês: positivo guardou, negativo resgatou.
		netSavedInCents: savedInCents - withdrawnInCents,
	});
});

/**
 * REMOVIDO: `GET /dashboard/credit-card-invoice`.
 *
 * Somava as compras no crédito do MÊS DO CALENDÁRIO e chamava aquilo de
 * "fatura". Nunca batia com a cobrança do banco, porque a fatura real segue o
 * ciclo de fechamento do cartão — uma compra do dia 30 costuma cair na fatura
 * do mês seguinte, não na do mês em que foi feita.
 *
 * Substituído por `GET /bank-cards/:id/invoices`, que monta as faturas por
 * ciclo e ainda traz status e composição. Ver services/invoiceService.js.
 */

/**
 * Soma líquida da reserva: guardado menos resgatado.
 *
 * O `$cond` inverte o sinal do resgate dentro da própria agregação, então o
 * resultado é a VARIAÇÃO da reserva no período — e não mais um contador que só
 * cresce, como era antes de existir o resgate.
 */
async function sumNetSavings(match) {
	const [result] = await Transaction.aggregate([
		{ $match: { ...match, type: { $in: ["savings", "withdrawal"] } } },
		{
			$group: {
				_id: null,
				total: {
					$sum: {
						$cond: [
							{ $eq: ["$type", "savings"] },
							"$valueInCents",
							{ $multiply: ["$valueInCents", -1] },
						],
					},
				},
			},
		},
	]);

	return result?.total ?? 0;
}

/** Quanto a reserva variou no mês selecionado. */
const getSavedMoney = asyncHandler(async (req, res) => {
	const match = monthMatch(req.userId, req.validatedQuery);

	return res.json({ savedInCents: await sumNetSavings(match) });
});

/**
 * Saldo acumulado da reserva, de todo o histórico.
 *
 * Este é o número que o card "Valor guardado total" exibe. Antes ele somava
 * apenas os `savings` e portanto nunca diminuía: quem guardasse R$ 500/mês por
 * um ano e usasse R$ 3.000 numa viagem continuaria vendo R$ 6.000. Agora reflete
 * o que de fato está guardado.
 */
const getTotalSavedMoney = asyncHandler(async (req, res) => {
	const match = { user: toObjectId(req.userId) };

	return res.json({ savedInCents: await sumNetSavings(match) });
});

/**
 * Gastos por categoria no mês.
 *
 * O $lookup traz nome e cor da categoria em uma única viagem, substituindo o
 * N+1 anterior (um findOne por categoria dentro de um Promise.all).
 */
const getCategoryBreakdown = asyncHandler(async (req, res) => {
	const match = {
		...monthMatch(req.userId, req.validatedQuery),
		type: { $in: ["debit", "credit"] },
	};

	const breakdown = await Transaction.aggregate([
		{ $match: match },
		{ $group: { _id: "$category", totalInCents: { $sum: "$valueInCents" } } },
		{
			$lookup: {
				from: "categories",
				localField: "_id",
				foreignField: "_id",
				as: "category",
			},
		},
		{ $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
		{
			$project: {
				_id: 0,
				categoryId: "$_id",
				// Despesas sem categoria (receitas convertidas, dados antigos)
				// caem em "Sem categoria" em vez de sumirem do gráfico.
				category: { $ifNull: ["$category.name", "Sem categoria"] },
				color: { $ifNull: ["$category.color", "#94a3b8"] },
				totalInCents: 1,
			},
		},
		{ $sort: { totalInCents: -1 } },
	]);

	return res.json(breakdown);
});

// ── Projeção de caixa futura ──────────────────────────────────

/**
 * PROJEÇÃO — "quanto do dinheiro que ainda vai entrar já tem destino?"
 *
 * Comprometido é o que ainda PRECISA SAIR da conta, mês a mês, a partir do mês
 * corrente. Duas fontes, e só duas:
 *
 * 1. FATURA DE CARTÃO, no mês do VENCIMENTO — é quando o dinheiro sai. Como o
 *    ciclo é nomeado pelo ano-mês do vencimento (ver utils/invoiceCycle.js), a
 *    chave do ciclo já É a chave do mês da projeção: a fatura "2026-12" vence
 *    em dezembro de 2026. Nada de inferir mês de fatura a partir do mês da
 *    compra — foi daí que saíram os dois bugs anteriores desta área.
 *
 *    Vale o `remainingInCents` da fatura, não o total: o que já foi pago não
 *    está mais comprometido. Fatura quitada projeta zero.
 *
 * 2. DÉBITO FUTURO, no mês da própria data. A compra no crédito NÃO entra aqui:
 *    ela já foi contada via fatura, e somar as duas coisas contaria o mesmo
 *    gasto duas vezes — uma na compra, outra no pagamento.
 *
 * Receita futura não é projetada. Projeção de entrada é outro assunto.
 *
 * O recorte temporal das duas fontes é o mesmo critério ("o que ainda vai
 * sair"), e por isso parece assimétrico à primeira vista:
 *   - a fatura do mês corrente entra pelo que falta pagar, mesmo se o
 *     vencimento já passou — a dívida continua lá;
 *   - o débito só conta a partir de HOJE, porque o datado no dia 3 quando hoje
 *     é dia 20 já saiu da conta e não compromete mais nada.
 */

/** Chaves "AAAA-MM" do mês corrente até `count - 1` meses à frente. */
function projectionMonthKeys(count, now = new Date()) {
	const year = now.getUTCFullYear();
	const monthIndex = now.getUTCMonth();

	return Array.from({ length: count }, (_, index) =>
		toCycleKey(new Date(Date.UTC(year, monthIndex + index, 1)))
	);
}

/**
 * Quantas parcelas de compra parcelada caem em cada ciclo, em UMA consulta.
 *
 * As fronteiras do `$bucket` saem dos ranges que o invoiceCycle já calculou —
 * aqui não se recalcula fechamento nem vencimento, só se distribuem as
 * transações pelos intervalos que ele definiu.
 *
 * O invoiceService devolve `transactionCount`, que conta toda compra do ciclo.
 * A projeção quer outra coisa: quantas PARCELAS de compras parceladas pesam
 * naquele mês, que é o número que a tela mostra ao lado do valor.
 */
async function countInstallmentsByCycle(userId, cardId, ranges) {
	if (ranges.length === 0) return new Map();

	const ascending = [...ranges].sort((a, b) => a.start - b.start);

	// O limite superior do $bucket é EXCLUSIVO; o +1ms evita perder a compra
	// feita exatamente no instante do fechamento. Mesmo motivo do invoiceService.
	const lastEnd = ascending[ascending.length - 1].end;
	const boundaries = [...ascending.map((range) => range.start), new Date(lastEnd.getTime() + 1)];

	const buckets = await Transaction.aggregate([
		{
			$match: {
				user: toObjectId(userId),
				bankCard: toObjectId(cardId),
				type: "credit",
				"installment.total": { $gt: 1 },
				date: { $gte: boundaries[0], $lte: boundaries[boundaries.length - 1] },
			},
		},
		{
			$bucket: {
				groupBy: "$date",
				boundaries,
				default: "fora",
				output: { installmentCount: { $sum: 1 } },
			},
		},
	]);

	// O _id do bucket é a fronteira inferior, ou seja, o início do ciclo.
	const byStart = new Map(
		buckets
			.filter((bucket) => bucket._id !== "fora")
			.map((bucket) => [new Date(bucket._id).getTime(), bucket.installmentCount])
	);

	return new Map(
		ascending.map((range) => [range.cycle, byStart.get(range.start.getTime()) ?? 0])
	);
}

/**
 * Faturas e parcelas de um cartão dentro da janela da projeção.
 *
 * Duas consultas por cartão (as do invoiceService) mais uma para as parcelas,
 * todas cobrindo a janela inteira de uma vez. O laço é sobre CARTÕES, não sobre
 * meses: cada cartão tem seu próprio fechamento, então as fronteiras de ciclo
 * mudam de cartão para cartão e não há como agrupar os dois numa consulta só.
 */
async function projectCard(userId, card, months, lastCycle) {
	const ranges = recentCycles(card, months, lastCycle);

	const [invoices, installments] = await Promise.all([
		listInvoices(userId, card, months, lastCycle),
		countInstallmentsByCycle(userId, card._id, ranges),
	]);

	return { card, invoices, installments };
}

/** Débitos já datados na janela, somados por mês da própria data. */
async function sumFutureDebitsByMonth(userId, from, to) {
	const rows = await Transaction.aggregate([
		{ $match: { user: userId, type: "debit", date: { $gte: from, $lte: to } } },
		{
			$group: {
				// Chave no mesmo formato do ciclo, para casar com os meses da série.
				_id: { $dateToString: { format: "%Y-%m", date: "$date", timezone: "UTC" } },
				totalInCents: { $sum: "$valueInCents" },
			},
		},
	]);

	return new Map(rows.map((row) => [row._id, row.totalInCents]));
}

const getProjection = asyncHandler(async (req, res) => {
	const months = req.validatedQuery.months ?? 6;
	const userId = toObjectId(req.userId);
	const now = new Date();

	const monthKeys = projectionMonthKeys(months, now);
	const lastCycle = monthKeys[monthKeys.length - 1];

	// Hoje à meia-noite UTC: o débito de ontem já saiu da conta.
	const today = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
	);
	// Dia 0 do mês seguinte ao último projetado = fim do último mês da janela.
	const windowEnd = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + months, 0, 23, 59, 59, 999)
	);

	/**
	 * Cartão sem ciclo configurado não monta fatura nenhuma, então fica fora da
	 * projeção — e as compras feitas nele também. Não é caso de erro: o usuário
	 * ainda vai preencher fechamento e vencimento, e até lá a rota responde
	 * normalmente com o que já dá para saber.
	 */
	const cards = (
		await BankCard.find({ user: userId }).sort({ starred: -1, createdAt: -1 })
	).filter((card) => card.hasInvoiceCycle());

	const [debitsByMonth, cardProjections] = await Promise.all([
		sumFutureDebitsByMonth(userId, today, windowEnd),
		Promise.all(cards.map((card) => projectCard(req.userId, card, months, lastCycle))),
	]);

	// A série nasce completa e zerada: mês sem nada comprometido continua na
	// lista, porque a tela desenha a série inteira e um buraco deslocaria o eixo.
	const series = new Map(
		monthKeys.map((month) => [
			month,
			{
				month,
				label: cycleLabel(month),
				committedInCents: 0,
				invoicesInCents: 0,
				debitsInCents: 0,
				installmentCount: 0,
				cards: [],
			},
		])
	);

	for (const { card, invoices, installments } of cardProjections) {
		for (const invoice of invoices) {
			const entry = series.get(invoice.cycle);
			// O invoiceService devolve exatamente os ciclos da janela; a guarda é
			// só para nunca somar fora da série.
			if (!entry) continue;

			const installmentCount = installments.get(invoice.cycle) ?? 0;

			entry.invoicesInCents += invoice.remainingInCents;
			entry.installmentCount += installmentCount;

			// Fatura vazia não vira linha na abertura. A já paga continua, com
			// committedInCents zero: a tela pode mostrar "fatura de R$ 500, paga".
			if (invoice.totalInCents > 0 || invoice.paidInCents > 0) {
				entry.cards.push({
					cardId: card._id,
					name: card.name,
					color: card.color,
					lastFourDigits: card.lastFourDigits,
					cycle: invoice.cycle,
					dueDate: invoice.dueDate,
					totalInCents: invoice.totalInCents,
					paidInCents: invoice.paidInCents,
					committedInCents: invoice.remainingInCents,
					installmentCount,
				});
			}
		}
	}

	for (const entry of series.values()) {
		entry.debitsInCents = debitsByMonth.get(entry.month) ?? 0;
		entry.committedInCents = entry.invoicesInCents + entry.debitsInCents;

		// Maior compromisso primeiro, como no breakdown de categorias.
		entry.cards.sort(
			(a, b) => b.committedInCents - a.committedInCents || a.name.localeCompare(b.name)
		);
	}

	return res.json([...series.values()]);
});

module.exports = {
	getMonthlyBalance,
	getSavedMoney,
	getTotalSavedMoney,
	getCategoryBreakdown,
	getProjection,
};
