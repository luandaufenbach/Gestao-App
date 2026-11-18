const crypto = require("crypto");
const RefreshToken = require("../models/RefreshToken");
const AppError = require("../utils/AppError");
const { refreshExpiresInDays } = require("../config/env");

/**
 * Ciclo de vida da sessão renovável (ROADMAP 0.9).
 *
 * Fica fora do controller porque três lugares diferentes precisam encerrar
 * sessões — sair da conta, redefinir a senha e excluir a conta — e cada um que
 * reimplementasse a regra seria mais uma chance de esquecer um caso.
 */

/** Falha única para token ausente, desconhecido, expirado ou já usado. */
const invalidSession = () => AppError.unauthorized("Sessão inválida, faça login novamente");

const hash = (token) => crypto.createHash("sha256").update(token).digest("hex");

function expiryDate() {
	const date = new Date();
	date.setUTCDate(date.getUTCDate() + refreshExpiresInDays);

	return date;
}

/**
 * Cria uma sessão nova e devolve o token em claro — a única vez que ele existe
 * fora do cliente. O banco fica só com o hash.
 *
 * 32 bytes de `randomBytes` é aleatoriedade de qualidade criptográfica. Um
 * token previsível aqui valeria tanto quanto uma senha vazada.
 */
async function issue(userId) {
	const token = crypto.randomBytes(32).toString("hex");

	await RefreshToken.create({
		tokenHash: hash(token),
		user: userId,
		expiresAt: expiryDate(),
	});

	return token;
}

/**
 * Troca um token válido por um novo, encerrando o anterior.
 *
 * A rotação é o que limita o estrago de um token copiado: ele serve uma vez só,
 * e a tentativa seguinte denuncia a cópia.
 *
 * REÚSO = ROUBO. Se chega um token que já foi trocado, existem duas cópias em
 * circulação e não há como saber qual delas é do dono. Derrubar todas as
 * sessões é a única resposta honesta: custa um login ao dono e tira o invasor
 * de dentro. O silêncio custaria a conta.
 */
async function rotate(token) {
	if (typeof token !== "string" || token === "") throw invalidSession();

	const stored = await RefreshToken.findOne({ tokenHash: hash(token) });

	if (!stored) throw invalidSession();

	if (stored.usedAt) {
		await revokeAllForUser(stored.user);
		throw invalidSession();
	}

	if (stored.expiresAt <= new Date()) {
		await stored.deleteOne();
		throw invalidSession();
	}

	stored.usedAt = new Date();
	await stored.save();

	return { userId: String(stored.user), token: await issue(stored.user) };
}

/**
 * Encerra UMA sessão: a do dispositivo que está saindo.
 *
 * Não lança quando o token é desconhecido. Sair da conta precisa funcionar
 * mesmo com a sessão já expirada ou já encerrada — devolver erro aqui deixaria
 * o usuário preso a uma tela da qual ele acabou de pedir para sair.
 */
async function revoke(token) {
	if (typeof token !== "string" || token === "") return;

	await RefreshToken.deleteOne({ tokenHash: hash(token) });
}

/** Encerra TODAS as sessões do usuário, em qualquer dispositivo. */
async function revokeAllForUser(userId) {
	await RefreshToken.deleteMany({ user: userId });
}

module.exports = { issue, rotate, revoke, revokeAllForUser };
