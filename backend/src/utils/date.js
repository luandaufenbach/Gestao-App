/**
 * Utilitários de data — tudo em UTC, sem exceção.
 *
 * BUG CORRIGIDO (C2): a versão anterior montava o intervalo do mês com
 * `new Date(y, m, 1)`, que usa o fuso horário LOCAL do servidor, enquanto as
 * datas são gravadas no Mongo em UTC.
 *
 * Em America/Sao_Paulo (UTC-3) isso produzia:
 *   início de março = 2026-03-01T03:00:00Z
 * Ou seja, uma transação gravada em 2026-03-01T00:00:00Z ficava FORA de março
 * e caía dentro do intervalo de fevereiro. Na prática, toda transação lançada
 * no dia 1º aparecia no mês errado.
 *
 * Usando Date.UTC o intervalo é exatamente [00:00:00.000Z do dia 1,
 * 23:59:59.999Z do último dia], independentemente do fuso do servidor.
 */

/** Converte para inteiro apenas se o valor for realmente numérico. */
const toInt = (value) => {
	if (value === undefined || value === null || value === "") return null;
	const parsed = Number(value);
	return Number.isInteger(parsed) ? parsed : null;
};

/**
 * Intervalo UTC de um mês.
 * @param {number|string} [year] - Ano com 4 dígitos. Padrão: ano atual (UTC).
 * @param {number|string} [month] - Mês de 1 a 12. Padrão: mês atual (UTC).
 * @returns {{ start: Date, end: Date }}
 */
function getMonthRangeUTC(year, month) {
	const now = new Date();

	const parsedYear = toInt(year);
	const parsedMonth = toInt(month);

	const y = parsedYear !== null ? parsedYear : now.getUTCFullYear();
	// Internamente o mês é 0-indexado, como no construtor de Date.
	const m = parsedMonth !== null ? parsedMonth - 1 : now.getUTCMonth();

	if (y < 1970 || y > 9999) {
		throw new RangeError("Ano fora do intervalo suportado");
	}
	if (m < 0 || m > 11) {
		throw new RangeError("Mês deve estar entre 1 e 12");
	}

	return {
		start: new Date(Date.UTC(y, m, 1, 0, 0, 0, 0)),
		// Dia 0 do mês seguinte = último dia deste mês.
		end: new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999)),
	};
}

/** Captura o dia COMO ESCRITO no início de uma string de data. */
const WRITTEN_DAY = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Normaliza uma data de entrada para meia-noite UTC.
 *
 * O front envia "2026-03-15" (input type="date"). Ancorar em 00:00:00.000Z
 * garante que o dia gravado é exatamente o dia escolhido pelo usuário e que
 * ele cai sempre dentro do intervalo do mês correspondente.
 *
 * BUG CORRIGIDO (um dia de diferença nas compras no crédito): a versão
 * anterior fazia `new Date(input)` e depois lia o dia em UTC do INSTANTE
 * resultante. Para "2026-11-04" dá no mesmo, mas para qualquer string com hora
 * o dia gravado passava a depender de fuso — do fuso do payload e do fuso do
 * processo:
 *
 *   "2026-11-04T00:00:00+03:00" -> instante 2026-11-03T21:00Z -> gravava dia 03
 *   "2026-11-04T23:59:00"       -> dia 04 em UTC, dia 05 em America/Sao_Paulo
 *
 * Era exatamente o sintoma relatado: escolhe-se o dia 04 e a fatura exibe 03.
 *
 * A causa de fundo é conceitual: o dia de uma compra NÃO é um instante, é o dia
 * que a pessoa marcou no calendário. Por isso ele agora é lido da própria
 * string, sem passar pelo parser sensível a fuso. Só quando a entrada não
 * declara um dia (um Date já pronto) é que caímos no caminho antigo.
 */
function normalizeToUTCDay(input) {
	if (typeof input === "string") {
		const match = WRITTEN_DAY.exec(input.trim());

		if (match) {
			const [, year, month, day] = match.map(Number);
			const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

			// "2026-02-30" casa com o regex mas não existe: Date.UTC rola para
			// março e a comparação abaixo recusa.
			return date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
		}
	}

	const date = input instanceof Date ? input : new Date(input);
	if (Number.isNaN(date.getTime())) return null;

	return new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0)
	);
}

/**
 * Soma meses a uma data mantendo tudo em UTC.
 *
 * Trata o estouro de dia: 31/01 + 1 mês vira 28/02 (ou 29/02), e não 03/03
 * como faria o setMonth() nativo. Isso importa para parcelas de cartão
 * lançadas no fim do mês.
 */
function addMonthsUTC(date, monthsToAdd) {
	const year = date.getUTCFullYear();
	const month = date.getUTCMonth();
	const day = date.getUTCDate();

	// Último dia do mês de destino.
	const lastDayOfTargetMonth = new Date(Date.UTC(year, month + monthsToAdd + 1, 0)).getUTCDate();

	return new Date(
		Date.UTC(year, month + monthsToAdd, Math.min(day, lastDayOfTargetMonth), 0, 0, 0, 0)
	);
}

/**
 * Nomes dos meses em português, para rótulos de exibição.
 *
 * Moram aqui, e não no invoiceCycle, porque formatar "AAAA-MM" não tem nada de
 * fatura: o relatório mensal usa a mesma chave para o mês do CALENDÁRIO. O que
 * é específico da fatura é o SIGNIFICADO da chave (o ano-mês do vencimento), e
 * esse significado continua documentado em utils/invoiceCycle.js.
 */
const MONTH_NAMES = [
	"janeiro",
	"fevereiro",
	"março",
	"abril",
	"maio",
	"junho",
	"julho",
	"agosto",
	"setembro",
	"outubro",
	"novembro",
	"dezembro",
];

/** Data -> "2026-08", sempre em UTC. */
function toMonthKey(date) {
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * "2026-08" -> "agosto de 2026".
 *
 * Devolve a entrada intacta quando ela não é uma chave de mês válida: rótulo é
 * exibição, e uma chave estranha não vale derrubar a resposta inteira.
 */
function monthKeyLabel(key) {
	const match = /^(\d{4})-(\d{2})$/.exec(String(key ?? ""));
	if (!match) return key;

	const monthIndex = Number(match[2]) - 1;
	if (monthIndex < 0 || monthIndex > 11) return key;

	return `${MONTH_NAMES[monthIndex]} de ${Number(match[1])}`;
}

module.exports = {
	getMonthRangeUTC,
	normalizeToUTCDay,
	addMonthsUTC,
	toMonthKey,
	monthKeyLabel,
};
