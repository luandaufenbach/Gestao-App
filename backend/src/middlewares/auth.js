const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { jwtSecret } = require("../config/env");

/**
 * Middleware de autenticação por JWT.
 *
 * MOTIVO (C5): antes NENHUMA rota era protegida e nenhum documento tinha dono.
 * Qualquer pessoa que alcançasse a porta do servidor lia e apagava todos os
 * dados financeiros. Este middleware, combinado com o campo `user` nos models,
 * é o que torna a aplicação multi-usuário e segura.
 *
 * Após passar por aqui, req.userId contém o id do usuário autenticado, e todo
 * controller DEVE usá-lo como filtro nas consultas.
 *
 * MOTIVO (existência do usuário): validar só a assinatura do token não basta.
 * O token vale 7 dias e nada o revoga, então depois de `DELETE /account` ele
 * continuava autenticando — e, pior, continuava CRIANDO documentos com `user`
 * apontando para um usuário que não existe mais. Esses documentos ficam órfãos:
 * nenhuma tela os mostra, porque toda tela consulta pelo usuário logado, e
 * nenhuma exclusão posterior os alcança, porque a conta que os apagaria já foi
 * embora. Reproduzido: `POST /transactions` respondia 201 depois da exclusão.
 *
 * CUSTO: uma consulta por requisição autenticada. É a mais barata que o MongoDB
 * oferece — busca pela chave primária, com 1 chave de índice e 1 documento
 * examinados (confirmado por `explain`: estágio EXPRESS_IXSCAN sobre o índice
 * `_id_`). Medido contra mongod local, fica em torno de 2 ms, algo como 5% de um
 * `GET /transactions` e 11% de um `GET /dashboard/monthly-balance` — para
 * comparação, o bcrypt de um login custa centenas de milissegundos. Ver a nota
 * sobre cache em `loadUserId` antes de propor otimização.
 */

/**
 * Token inválido, em todas as formas.
 *
 * Assinatura quebrada, `sub` sem formato de id e usuário inexistente recebem a
 * MESMA mensagem, de propósito. Responder "essa conta foi excluída" confirmaria
 * ao portador do token que a conta existiu, e para quem roubou o token é
 * exatamente a informação que ele ainda não tem.
 */
const invalidToken = () => AppError.unauthorized("Token inválido");

/**
 * Confirma que o usuário do token ainda existe e devolve o id, ou `null`.
 *
 * Lança apenas em falha de infraestrutura — id malformado é tratado aqui mesmo
 * como token ruim, porque é o token que está errado, não o servidor.
 *
 * SEM CACHE, de propósito. Um cache com TTL de N segundos é, por definição, uma
 * janela de N segundos em que o token de uma conta excluída continua aceito e
 * continua gravando documento órfão — exatamente o defeito que este código
 * existe para fechar. Um cache só seria aceitável com invalidação explícita na
 * exclusão da conta, e aí o ganho é de uma consulta indexada por requisição,
 * que é a parte barata de qualquer rota desta API (as agregações do dashboard e
 * o bcrypt do login custam ordens de grandeza mais).
 */
async function loadUserId(sub) {
	/**
	 * `sub` precisa ser string não vazia ANTES de virar filtro.
	 *
	 * Mongoose descarta chaves `undefined`: `findById(undefined)` vira
	 * `findOne({})`, que casa com o PRIMEIRO usuário da coleção. Um `sub` ausente,
	 * ou um objeto como `{ $ne: null }`, passaria na verificação de existência
	 * em vez de falhar nela. A verificação de tipo é o que impede que a consulta
	 * de segurança se transforme em "existe algum usuário no banco?".
	 */
	if (typeof sub !== "string" || sub === "") {
		return null;
	}

	/**
	 * `.select("_id").lean()`: não precisamos de nada do documento além da
	 * confirmação de que ele existe. A projeção evita trazer os campos do
	 * usuário pela rede a cada requisição, e o `.lean()` evita montar um
	 * documento Mongoose completo para jogar fora na linha seguinte.
	 */
	const user = await User.findById(sub).select("_id").lean();

	return user ? sub : null;
}

/**
 * Marca a requisição como autenticada.
 *
 * Em função separada por causa da regra `require-atomic-updates`: ela aponta
 * toda atribuição a propriedade de objeto externo feita depois de um `await`,
 * que é o padrão de uma corrida de verdade em outros lugares. Aqui não há
 * corrida — `req` pertence a esta requisição e a mais ninguém — e isolar a
 * atribuição é melhor que desligar a regra, que no resto do backend pega
 * defeito real.
 *
 * O valor atribuído é a string do payload, e não o `_id` do documento lido.
 * Trocar por um ObjectId mudaria o tipo que todo controller já recebe hoje em
 * `{ user: req.userId }` e em `String(req.userId)`.
 */
const attachUserId = (request, userId) => {
	request.userId = userId;
};

async function authenticate(req, res, next) {
	const header = req.headers.authorization || "";

	if (!header.startsWith("Bearer ")) {
		return next(AppError.unauthorized("Token de autenticação ausente"));
	}

	const token = header.slice("Bearer ".length).trim();

	if (!token) {
		return next(AppError.unauthorized("Token de autenticação ausente"));
	}

	let payload;

	try {
		payload = jwt.verify(token, jwtSecret);
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			return next(AppError.unauthorized("Sessão expirada, faça login novamente"));
		}
		// Não repassamos o detalhe do erro: para um atacante, "assinatura
		// inválida" e "token malformado" são informação útil.
		return next(invalidToken());
	}

	let userId;

	try {
		userId = await loadUserId(payload.sub);
	} catch (error) {
		// `sub` que não tem formato de ObjectId: o defeito está no token.
		if (error instanceof mongoose.Error.CastError) {
			return next(invalidToken());
		}

		/**
		 * Banco fora do ar, timeout, falha de rede: o problema é do servidor, e
		 * 401 diria ao usuário que a credencial dele é que está ruim. Ele
		 * apagaria uma sessão perfeitamente válida e faria login de novo sem
		 * necessidade, enquanto o erro real sumiria do log. Vai para o
		 * errorHandler, que registra o stack e devolve 500.
		 */
		return next(error);
	}

	if (!userId) {
		return next(invalidToken());
	}

	attachUserId(req, userId);
	return next();
}

module.exports = authenticate;
