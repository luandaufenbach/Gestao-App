const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const Goal = require("../models/Goal");
const BankCard = require("../models/BankCard");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Direitos do titular pela LGPD (art. 18): portabilidade e eliminação.
 *
 * Duas rotas, as duas irreversíveis em sentidos opostos — uma entrega a cópia
 * integral dos dados, a outra apaga tudo. Por isso as duas exigem autenticação,
 * escopo por usuário em cada consulta e limite de requisição próprio (ver
 * routes/account.js).
 */

/**
 * Versão do formato do arquivo exportado.
 *
 * Vai dentro do próprio arquivo para que um JSON salvo hoje continue
 * interpretável depois de o formato mudar. Incremente ao remover ou renomear
 * campo; acrescentar campo novo não exige incremento.
 */
const EXPORT_FORMAT_VERSION = 1;

/**
 * Allowlist dos campos da conta.
 *
 * É uma allowlist, e não `-passwordHash -passwordResetTokenHash`, de propósito.
 * Os três campos sensíveis do User já têm `select: false` no schema, o que
 * bastaria hoje — mas um campo sensível acrescentado amanhã sem esse cuidado
 * entraria no arquivo exportado em silêncio. Com allowlist, o pior caso é um
 * campo novo faltar na exportação, não vazar nela.
 */
const ACCOUNT_FIELDS = "name email emailVerifiedAt createdAt updatedAt";

/**
 * Allowlist dos campos do cartão.
 *
 * `lastFourDigits` é o único dado do número do cartão que existe no banco, e é o
 * mesmo que já aparece na tela. Guardar o PAN completo exigiria conformidade
 * PCI-DSS (ver models/BankCard.js) — não existe hoje e não deve passar a existir
 * por causa da exportação.
 */
const BANK_CARD_FIELDS =
	"name bank lastFourDigits type limitInCents closingDay dueDay color starred createdAt updatedAt";

/**
 * Escreve no response respeitando contrapressão.
 *
 * `res.write` devolve `false` quando o buffer interno do socket encheu. Ignorar
 * esse retorno faz o Node acumular o arquivo inteiro na memória do processo —
 * ou seja, seria "streaming" só no nome, e uma conta com anos de histórico
 * derrubaria o servidor igual. Esperar o `drain` é o que torna o uso de memória
 * constante, independente do tamanho do histórico.
 */
const writeChunk = (res, chunk) =>
	res.write(chunk) ? Promise.resolve() : new Promise((resolve) => res.once("drain", resolve));

/**
 * GET /account/export — portabilidade.
 *
 * DECISÃO DE VOLUME: streaming por cursor, sem teto.
 *
 * Um teto declarado seria mais simples, mas entregaria ao titular uma cópia
 * incompleta dos próprios dados — que é exatamente o direito que esta rota
 * existe para atender. Truncar a exportação não é um detalhe de desempenho, é
 * o defeito de conformidade.
 *
 * Só `transactions` cresce sem limite (uma compra em 12x nasce como 12
 * documentos), então é a única coleção lida por cursor. Categorias, metas e
 * cartões são dezenas de documentos por conta, com teto prático dado pela
 * própria interface, e são carregadas de uma vez.
 *
 * O `meta.counts` é contado no banco ANTES do streaming e vai no cabeçalho do
 * arquivo. Isso dá ao cliente como verificar integridade: se
 * `transactions.length` não bate com `meta.counts.transactions`, o download veio
 * truncado. Sem o contador, uma conexão interrompida no meio produziria um
 * arquivo plausível e incompleto.
 */
const exportAccount = asyncHandler(async (req, res) => {
	const userId = req.userId;
	const scope = { user: userId };

	/**
	 * Tudo que pode falhar acontece ANTES do primeiro byte.
	 *
	 * Depois de `res.write`, o status 200 já foi enviado e o errorHandler não tem
	 * mais como traduzir um erro para HTTP. Deixar as consultas pequenas e a
	 * contagem aqui concentra quase toda chance de falha no trecho em que uma
	 * resposta de erro ainda é possível.
	 */
	const [account, categories, goals, bankCards, transactionCount] = await Promise.all([
		User.findById(userId).select(ACCOUNT_FIELDS).lean(),
		Category.find(scope).select("-__v").sort({ name: 1 }).lean(),
		Goal.find(scope).select("-__v").sort({ createdAt: 1 }).lean(),
		BankCard.find(scope).select(BANK_CARD_FIELDS).sort({ createdAt: 1 }).lean(),
		Transaction.countDocuments(scope),
	]);

	if (!account) {
		throw AppError.unauthorized("Usuário não encontrado");
	}

	const meta = {
		formatVersion: EXPORT_FORMAT_VERSION,
		// O retrato é de um instante: o titular precisa saber de quando ele é.
		generatedAt: new Date().toISOString(),
		application: "Gestão App",
		/**
		 * A unidade vai declarada DENTRO do arquivo. Fora do app, um `valueInCents`
		 * de 1000 é ambíguo — pode ser lido como mil reais. Sem esta linha a
		 * portabilidade entrega um número que o titular não consegue interpretar.
		 */
		monetaryUnit: "BRL_CENTS",
		monetaryUnitNote:
			"Todo campo com sufixo InCents é um inteiro em centavos de real brasileiro. 1000 = R$ 10,00.",
		dateNote: "Datas em ISO 8601, UTC. Datas de transação são gravadas em 00:00:00.000Z.",
		/**
		 * As coleções não vêm populadas de propósito: `category`, `bankCard` e
		 * `goal` em cada transação são os `_id` das outras coleções do mesmo
		 * arquivo. Replicar o documento inteiro em cada transação multiplicaria o
		 * tamanho do arquivo e esconderia o vínculo.
		 */
		referenceNote:
			"Os campos category, bankCard e goal das transações referenciam o _id dos documentos das respectivas coleções neste mesmo arquivo.",
		counts: {
			transactions: transactionCount,
			categories: categories.length,
			goals: goals.length,
			bankCards: bankCards.length,
		},
	};

	// Nome do arquivo sem nada de pessoal: só a data da geração.
	const filename = `gestao-app-export-${meta.generatedAt.slice(0, 10)}.json`;

	res.status(200);
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
	// Dado pessoal não fica em cache de navegador nem de proxy.
	res.setHeader("Cache-Control", "no-store");

	// `_id` em todas as coleções, inclusive na conta: é o arquivo que o titular
	// vai ler fora do app, e um identificador com dois nomes diferentes atrapalha.
	const head =
		`{"meta":${JSON.stringify(meta)}` +
		`,"account":${JSON.stringify(account)}` +
		`,"categories":${JSON.stringify(categories)}` +
		`,"goals":${JSON.stringify(goals)}` +
		`,"bankCards":${JSON.stringify(bankCards)}` +
		`,"transactions":[`;

	const cursor = Transaction.find(scope)
		.select("-__v")
		.sort({ date: 1, createdAt: 1 })
		.lean()
		.cursor();

	try {
		await writeChunk(res, head);

		let separator = "";
		for await (const transaction of cursor) {
			await writeChunk(res, separator + JSON.stringify(transaction));
			separator = ",";
		}

		await writeChunk(res, "]}");
		return res.end();
	} catch (error) {
		await cursor.close();

		/**
		 * Falha no meio do streaming: o 200 já foi enviado, então não há como
		 * devolver um status de erro. Derrubar a conexão é melhor que encerrar o
		 * JSON: o cliente recebe um documento truncado, o `JSON.parse` falha e o
		 * titular sabe que precisa baixar de novo. Fechar bonitinho entregaria um
		 * arquivo válido e incompleto, que é o pior resultado possível aqui.
		 */
		if (res.headersSent) {
			res.destroy();
			return undefined;
		}

		throw error;
	}
});

/**
 * DELETE /account — eliminação.
 *
 * A ordem é dependentes primeiro, usuário por último, e importa: se uma das
 * exclusões falhar no meio, o documento do usuário ainda existe e o titular pode
 * repetir a requisição. Apagar o usuário primeiro deixaria os dados financeiros
 * para trás sem dono — órfão que nenhuma tela mostra e nenhuma exclusão alcança.
 *
 * Sem transação de banco de propósito: `session`/`startTransaction` exige replica
 * set, que nem o Atlas de camada gratuita nem o banco em memória dos testes
 * garantem. A ordem acima, mais a contagem devolvida na resposta, é o que dá
 * verificabilidade sem depender disso.
 */
const deleteAccount = asyncHandler(async (req, res) => {
	const userId = req.userId;
	const { password } = req.body;

	// O hash tem select:false no schema, então precisa ser pedido explicitamente.
	const user = await User.findById(userId).select("+passwordHash");

	if (!user) {
		throw AppError.unauthorized("Usuário não encontrado");
	}

	const passwordMatches = await user.verifyPassword(password);
	if (!passwordMatches) {
		// 401 e nada apagado. Nenhum log: a tentativa frustrada não vale o
		// registro de dado pessoal que ele deixaria.
		throw AppError.unauthorized("Senha incorreta");
	}

	const scope = { user: userId };

	const [transactions, categories, goals, bankCards] = await Promise.all([
		Transaction.deleteMany(scope),
		Category.deleteMany(scope),
		Goal.deleteMany(scope),
		BankCard.deleteMany(scope),
	]);

	await User.deleteOne({ _id: userId });

	/**
	 * `sessionEnded` é o sinal para o frontend descartar o token e voltar para a
	 * tela de login. Sem ele, a interface continuaria chamando rotas com um token
	 * de uma conta que não existe mais e exibiria erro em vez de "conta excluída".
	 *
	 * A contagem serve de recibo da eliminação: o titular vê quantos registros
	 * foram apagados em cada coleção.
	 */
	return res.status(200).json({
		message: "Conta excluída. Todos os seus dados foram apagados definitivamente.",
		sessionEnded: true,
		deleted: {
			account: 1,
			transactions: transactions.deletedCount,
			categories: categories.deletedCount,
			goals: goals.deletedCount,
			bankCards: bankCards.deletedCount,
		},
	});
});

module.exports = { exportAccount, deleteAccount, EXPORT_FORMAT_VERSION };
