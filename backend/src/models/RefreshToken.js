const mongoose = require("mongoose");

/**
 * Sessão renovável de um usuário (ROADMAP 0.9).
 *
 * MOTIVO: o JWT de acesso não é revogável — uma vez assinado, vale até expirar,
 * e nada no servidor consegue cancelá-lo. Enquanto ele valia 7 dias, isso
 * significava que um token roubado dava uma semana de acesso aos dados
 * financeiros da pessoa, e que sair da conta era só apagar o token do próprio
 * navegador: quem tivesse uma cópia continuava dentro.
 *
 * A troca: o acesso passa a durar minutos, e a continuidade da sessão vem
 * daqui. Este registro É a sessão — apagá-lo encerra o acesso de verdade, do
 * lado do servidor, que é o que "sair da conta" devia ter significado sempre.
 *
 * Guardamos o HASH do token, nunca ele próprio. Um vazamento do banco não pode
 * virar um conjunto de sessões utilizáveis — mesma razão pela qual a senha
 * também não fica em claro. SHA-256 basta aqui, ao contrário da senha: o token
 * tem 256 bits de aleatoriedade, então não há dicionário nem força bruta que o
 * alcance, e um hash lento só serviria para encarecer cada renovação.
 */
const RefreshTokenSchema = new mongoose.Schema(
	{
		/** SHA-256 do token entregue ao cliente, em hexadecimal. */
		tokenHash: { type: String, required: true, unique: true },

		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},

		/** Quando a sessão morre por idade, mesmo sem ninguém mexer nela. */
		expiresAt: { type: Date, required: true },

		/**
		 * Quando este token foi trocado por outro.
		 *
		 * O registro NÃO é apagado na rotação, e isso é proposital: um token já
		 * usado que reaparece é a assinatura clássica de roubo. O ladrão e o dono
		 * têm a mesma cópia, um dos dois renova primeiro, e o outro chega com um
		 * token gasto. Como não dá para saber qual dos dois é o dono, a resposta
		 * é derrubar todas as sessões daquele usuário e exigir login — ver
		 * `rotate` em `services/refreshTokens.js`.
		 */
		usedAt: { type: Date, default: null },
	},
	{ timestamps: true }
);

/**
 * Expurgo automático na data de expiração.
 *
 * Sem isto a coleção cresceria para sempre: cada login cria um registro e a
 * rotação cria mais um a cada renovação. O índice apaga tanto a sessão expirada
 * quanto o rastro das já rotacionadas, que depois do vencimento não servem nem
 * para detectar reúso.
 */
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RefreshToken", RefreshTokenSchema);
