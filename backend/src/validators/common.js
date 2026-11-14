const { z } = require("zod");
const mongoose = require("mongoose");

/** Valida um ObjectId do MongoDB vindo da URL ou do corpo. */
const objectId = z
	.string()
	.refine((value) => mongoose.Types.ObjectId.isValid(value), { message: "Id inválido" });

/** Params de rota no formato /:id */
const idParam = z.object({ id: objectId });

/** Cor hexadecimal #RRGGBB */
const hexColor = z
	.string()
	.regex(/^#[0-9a-fA-F]{6}$/, "Cor deve estar no formato hexadecimal (#RRGGBB)");

/**
 * Valor monetário em CENTAVOS.
 *
 * O cliente envia inteiros; qualquer fração é rejeitada aqui, antes de chegar
 * ao banco. Ver backend/src/utils/money.js para o porquê (C7).
 */
const cents = z
	.number()
	.int("Valor deve ser um inteiro em centavos")
	.min(0, "Valor não pode ser negativo")
	.max(Number.MAX_SAFE_INTEGER);

/**
 * Filtro de mês/ano usado pelo dashboard e pela listagem de transações.
 * Vem da query string, portanto chega como texto e precisa ser convertido.
 */
const monthQuery = z.object({
	year: z.coerce.number().int().min(1970).max(9999).optional(),
	month: z.coerce.number().int().min(1).max(12).optional(),
});

/**
 * Data no formato do input HTML (AAAA-MM-DD) ou ISO-8601 completa.
 *
 * BUG CORRIGIDO: o refine anterior era apenas
 *   !Number.isNaN(new Date(value).getTime())
 * isto é, aceitava tudo que o `new Date()` consegue engolir. Duas consequências
 * reais, as duas silenciosas:
 *
 *   - "04/11/2026" — a data como se escreve no Brasil — era lida como 11 de
 *     ABRIL, porque o parser não-ISO do V8 assume MM/DD/AAAA. O lançamento ia
 *     para o mês errado sem nenhum erro;
 *   - "2026-11-04T23:59:00", sem fuso, é interpretada no fuso LOCAL do
 *     processo. O mesmo corpo de requisição gravava dia 04 num servidor em UTC
 *     e dia 05 num servidor em America/Sao_Paulo.
 *
 * Agora o formato É o contrato: ou a data do input HTML, ou uma ISO-8601
 * completa. E o dia precisa existir de verdade — 2026-02-30 casa com o regex
 * mas é recusada.
 */
const ISO_DATE =
	/^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

const isRealCalendarDay = (value) => {
	const match = ISO_DATE.exec(value);
	if (!match) return false;

	const [, year, month, day] = match.map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));

	return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const dateString = z.string().refine(isRealCalendarDay, {
	message: "Data deve estar no formato AAAA-MM-DD",
});

/**
 * Ciclo de fatura no formato "AAAA-MM", correspondente ao ano-mês do
 * VENCIMENTO. Ver backend/src/utils/invoiceCycle.js.
 */
const cycleKey = z
	.string()
	.regex(/^\d{4}-\d{2}$/, "Ciclo deve estar no formato AAAA-MM")
	.refine((value) => {
		const month = Number(value.slice(5, 7));
		return month >= 1 && month <= 12;
	}, "Mês do ciclo deve estar entre 01 e 12");

module.exports = { objectId, idParam, hexColor, cents, monthQuery, dateString, cycleKey };
