const BankCard = require("../models/BankCard");
const Transaction = require("../models/Transaction");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { listInvoices, getInvoiceDetail } = require("../services/invoiceService");
const { cycleForMonth } = require("../utils/invoiceCycle");
const { hasPaidAccess, isFutureCycle } = require("../services/paidAccess");

/**
 * A mesma mensagem do `requirePaidPlan`, porque é o mesmo paywall visto de
 * outro ângulo. Duas redações para a mesma recusa confundiriam o usuário.
 */
const faturaFuturaEhPaga = () =>
	AppError.paymentRequired(
		"Ver fatura de mês que ainda não fechou faz parte do plano pago. " +
			"A fatura atual e todas as anteriores continuam liberadas."
	);

/**
 * Favorito primeiro, depois os mais recentes.
 *
 * A ordem sai do backend para que toda tela que lista cartões concorde sobre
 * qual é o primeiro — o card de Faturas e o formulário de transação usam essa
 * posição para escolher o cartão pré-selecionado.
 */
const listBankCards = asyncHandler(async (req, res) => {
	const cards = await BankCard.find({ user: req.userId })
		.sort({ starred: -1, createdAt: -1 })
		.lean();

	return res.json(cards);
});

/**
 * Tira a estrela dos demais cartões do usuário.
 *
 * Precisa rodar ANTES de gravar o novo favorito: o índice único parcial aceita
 * um só `starred: true` por usuário, então gravar primeiro violaria o índice.
 */
async function clearOtherFavorites(userId, exceptCardId = null) {
	const filter = { user: userId, starred: true };
	if (exceptCardId) filter._id = { $ne: exceptCardId };

	await BankCard.updateMany(filter, { $set: { starred: false } });
}

const createBankCard = asyncHandler(async (req, res) => {
	if (req.body.starred === true) {
		await clearOtherFavorites(req.userId);
	}

	const created = await BankCard.create({ ...req.body, user: req.userId });

	return res.status(201).json(created);
});

const updateBankCard = asyncHandler(async (req, res) => {
	if (req.body.starred === true) {
		/**
		 * A posse é conferida antes de mexer nos outros cartões. Sem isso, um
		 * PATCH num id alheio desmarcaria o favorito do próprio usuário e só
		 * depois responderia 404 — efeito colateral de uma requisição recusada.
		 */
		const owned = await BankCard.exists({ _id: req.params.id, user: req.userId });
		if (!owned) {
			throw AppError.notFound("Cartão não encontrado");
		}

		await clearOtherFavorites(req.userId, req.params.id);
	}

	const updated = await BankCard.findOneAndUpdate(
		{ _id: req.params.id, user: req.userId },
		req.body,
		{ returnDocument: "after", runValidators: true }
	);

	if (!updated) {
		throw AppError.notFound("Cartão não encontrado");
	}

	return res.json(updated);
});

const deleteBankCard = asyncHandler(async (req, res) => {
	const card = await BankCard.findOne({ _id: req.params.id, user: req.userId });

	if (!card) {
		throw AppError.notFound("Cartão não encontrado");
	}

	/**
	 * Ao contrário da categoria, o cartão é opcional na transação. Excluir o
	 * cartão não deve impedir nada nem apagar histórico: apenas desvincula.
	 * O gasto continua registrado, só deixa de apontar para um cartão.
	 */
	await Transaction.updateMany(
		{ user: req.userId, bankCard: card._id },
		{ $set: { bankCard: null } }
	);

	await BankCard.deleteOne({ _id: card._id, user: req.userId });

	return res.json({ message: "Cartão removido" });
});

/** Carrega o cartão garantindo posse e ciclo de fatura configurado. */
async function loadCardWithCycle(cardId, userId) {
	const card = await BankCard.findOne({ _id: cardId, user: userId });

	if (!card) {
		throw AppError.notFound("Cartão não encontrado");
	}
	if (!card.hasInvoiceCycle()) {
		throw AppError.badRequest(
			"Configure o dia de fechamento e o de vencimento do cartão para ver as faturas."
		);
	}

	return card;
}

const listInvoicesForCard = asyncHandler(async (req, res) => {
	const card = await loadCardWithCycle(req.params.id, req.userId);
	const { limit, year, month } = req.validatedQuery;

	/**
	 * Com year e month, a lista começa na fatura que recebe as compras daquele
	 * mês — é o que faz o card acompanhar a navegação do dashboard.
	 *
	 * BUG CORRIGIDO: a âncora era a string "AAAA-MM" do próprio mês. Como o
	 * ciclo é nomeado pelo mês do VENCIMENTO, selecionar setembro mostrava a
	 * fatura que vence em 05/09, que guarda as compras de agosto. A lista saía
	 * julho, agosto e setembro, e a fatura das compras de setembro — outubro —
	 * ficava de fora.
	 */
	const reference = year && month ? cycleForMonth(year, month, card) : new Date();

	const invoices = await listInvoices(req.userId, card, limit ?? 6, reference);

	/**
	 * A lista anda para TRÁS a partir da âncora, então no uso normal — âncora
	 * em hoje ou num mês passado — não existe ciclo futuro e nada aqui muda.
	 * Só quem navega o dashboard para frente alcança este caminho.
	 *
	 * Janela inteira no futuro vira 402 com mensagem; janela que mistura devolve
	 * só o permitido. Devolver lista vazia seria pior que recusar: o card
	 * apareceria vazio, como se o cartão não tivesse fatura nenhuma.
	 */
	if (!(await hasPaidAccess(req.userId))) {
		const liberadas = invoices.filter((invoice) => !isFutureCycle(card, invoice.cycle));
		if (liberadas.length === 0) throw faturaFuturaEhPaga();
		invoices.length = 0;
		invoices.push(...liberadas);
	}

	return res.json({
		card: {
			_id: card._id,
			name: card.name,
			bank: card.bank,
			color: card.color,
			lastFourDigits: card.lastFourDigits,
			closingDay: card.closingDay,
			dueDay: card.dueDay,
		},
		invoices,
	});
});

const getInvoice = asyncHandler(async (req, res) => {
	const card = await loadCardWithCycle(req.params.id, req.userId);

	if (isFutureCycle(card, req.params.cycle) && !(await hasPaidAccess(req.userId))) {
		throw faturaFuturaEhPaga();
	}

	const invoice = await getInvoiceDetail(req.userId, card, req.params.cycle);

	if (!invoice) {
		throw AppError.badRequest("Ciclo inválido. Use o formato AAAA-MM.");
	}

	return res.json(invoice);
});

module.exports = {
	listBankCards,
	createBankCard,
	updateBankCard,
	deleteBankCard,
	listInvoicesForCard,
	getInvoice,
};
