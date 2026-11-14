const mongoose = require("mongoose");

/**
 * Evento de webhook já recebido (ROADMAP 2.2).
 *
 * Existe por uma razão só: idempotência. O Asaas entrega *at least once* — o
 * mesmo evento chega duas vezes sempre que a nossa resposta demora ou falha.
 * Sem este registro, um `PAYMENT_RECEIVED` repetido estenderia a validade da
 * assinatura duas vezes, e o usuário ganharia meses de graça por acidente.
 *
 * O `_id` é o id do evento no provedor (`evt_...`). Usar a chave natural como
 * `_id` dá a unicidade de graça, sem índice extra: a segunda gravação do mesmo
 * evento falha com E11000, e é isso que o controller testa.
 */
const WebhookEventSchema = new mongoose.Schema(
	{
		_id: { type: String },

		/** Nome do evento, ex. PAYMENT_RECEIVED. Guardado para auditoria. */
		event: { type: String, required: true },

		/**
		 * Corpo cru, como chegou.
		 *
		 * Guardar antes de processar é o que a própria documentação do Asaas
		 * recomenda: se a regra de negócio falhar, o evento não se perde e dá
		 * para reprocessar. Sem isso, um bug no processamento vira dinheiro
		 * recebido sem acesso liberado.
		 */
		payload: { type: mongoose.Schema.Types.Mixed },

		/** Falso = chegou mas a regra de negócio não concluiu. Serve de fila de reparo. */
		processed: { type: Boolean, default: false },

		/** Mensagem do erro, quando `processed` é falso. */
		error: { type: String, default: null },
	},
	{ timestamps: true, _id: false }
);

/**
 * Expurgo automático em 90 dias.
 *
 * O registro só serve para desduplicar e para depurar o mês corrente; manter
 * o histórico inteiro faria a coleção crescer para sempre sem ninguém ler.
 * Noventa dias cobrem com folga a janela de retentativa do provedor, que é de
 * 14 dias.
 */
WebhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model("WebhookEvent", WebhookEventSchema);
