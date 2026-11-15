/**
 * Grava o ciclo de fatura nas parcelas criadas antes de ele passar a ser gravado.
 *
 * MOTIVO: a fatura de uma parcela era inferida da data dela, e a data é
 * encurtada nos meses curtos (31/01 + 1 mês = 28/02). Quando o dia encurtado
 * cai em cima do fechamento, a parcela volta para a fatura que a anterior já
 * ocupa: num cartão que fecha dia 28, uma compra de 31/01 em 3x punha as
 * parcelas 1 e 2 na fatura de março e deixava abril vazia.
 *
 * Agora cada parcela grava `invoiceCycle`, e a fatura prefere esse campo à
 * data. Este script preenche o campo no histórico — sem ele, as compras
 * antigas continuam com o erro.
 *
 * A primeira parcela é a âncora: a data dela é a data real da compra e nunca
 * foi encurtada. As seguintes são aritmética de mês sobre a chave do ciclo.
 *
 * O que o script NÃO toca:
 *   - compras à vista (`installment.total` 1), cuja data já identifica a fatura
 *   - grupos em cartão sem fechamento/vencimento configurado, que não montam fatura
 *   - grupos sem a parcela 1 (excluída individualmente): sem âncora confiável,
 *     são apenas relatados
 *
 * É idempotente: regrava o mesmo valor que já calculou antes.
 *
 *   node scripts/backfillInstallmentCycles.js          (simulação, não grava)
 *   node scripts/backfillInstallmentCycles.js --apply  (grava)
 */
require("dotenv").config();

const mongoose = require("mongoose");
const { mongoUri } = require("../src/config/env");
const Transaction = require("../src/models/Transaction");
const BankCard = require("../src/models/BankCard");
const { cycleForPurchase, shiftCycle } = require("../src/utils/invoiceCycle");

const apply = process.argv.includes("--apply");

async function main() {
	await mongoose.connect(mongoUri);

	const groupIds = await Transaction.distinct("installmentGroupId", {
		type: "credit",
		installmentGroupId: { $type: "string" },
	});

	if (groupIds.length === 0) {
		console.log("Nenhuma compra parcelada no crédito. Nada a fazer.");
		return;
	}

	const cardCache = new Map();
	const loadCard = async (cardId) => {
		const key = String(cardId);
		if (!cardCache.has(key)) {
			cardCache.set(
				key,
				await BankCard.findById(cardId).select("_id name closingDay dueDay").lean()
			);
		}
		return cardCache.get(key);
	};

	let changed = 0;
	let alreadyRight = 0;
	let skippedNoCard = 0;
	let skippedNoAnchor = 0;

	for (const groupId of groupIds) {
		const parcels = await Transaction.find({ installmentGroupId: groupId })
			.sort({ "installment.current": 1 })
			.select("_id date bankCard invoiceCycle installment.current")
			.lean();

		const anchor = parcels.find((parcel) => parcel.installment?.current === 1);
		if (!anchor) {
			console.warn(
				`grupo ${groupId}: sem a parcela 1 — ciclo não recalculado para ${parcels.length} parcela(s).`
			);
			skippedNoAnchor += parcels.length;
			continue;
		}

		const card = anchor.bankCard ? await loadCard(anchor.bankCard) : null;
		if (!card || card.closingDay == null || card.dueDay == null) {
			skippedNoCard += parcels.length;
			continue;
		}

		const firstCycle = cycleForPurchase(anchor.date, card).cycle;

		const operations = [];
		for (const parcel of parcels) {
			const cycle = shiftCycle(firstCycle, (parcel.installment?.current ?? 1) - 1);

			if (parcel.invoiceCycle === cycle) {
				alreadyRight++;
				continue;
			}

			console.log(
				`grupo ${groupId} parcela ${parcel.installment?.current}: ` +
					`${parcel.invoiceCycle ?? "(sem ciclo)"} -> ${cycle}`
			);
			changed++;
			operations.push({
				updateOne: { filter: { _id: parcel._id }, update: { $set: { invoiceCycle: cycle } } },
			});
		}

		if (apply && operations.length > 0) {
			await Transaction.bulkWrite(operations);
		}
	}

	const resumo =
		`${changed} parcela(s) com ciclo ${apply ? "gravado" : "a gravar"}, ` +
		`${alreadyRight} já corretas, ` +
		`${skippedNoCard} em cartão sem ciclo configurado, ` +
		`${skippedNoAnchor} sem parcela 1.`;

	console.log(apply ? `\n${resumo}` : `\nSIMULAÇÃO: ${resumo}\nRode com --apply para gravar.`);
}

main()
	.catch((error) => {
		console.error("Falhou:", error.message);
		process.exitCode = 1;
	})
	.finally(() => mongoose.disconnect());
