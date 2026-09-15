const mongoose = require("mongoose");

const CARD_TYPES = ["credit", "debit"];

const BankCardSchema = new mongoose.Schema(
	{
		// MUDANÇA (C5): escopo por usuário.
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		name: {
			type: String,
			required: [true, "Nome do cartão é obrigatório"],
			trim: true,
			maxlength: 60,
		},
		/**
		 * Apenas os 4 últimos dígitos, sempre.
		 *
		 * A validação anterior era `String(lastFourDigits).length > 4`, que aceitava
		 * 1, 2 ou 3 dígitos e também qualquer caractere não numérico. O regex abaixo
		 * exige exatamente 4 dígitos.
		 *
		 * Nota de segurança: guardar o PAN completo exigiria conformidade PCI-DSS.
		 * Os 4 últimos dígitos são explicitamente permitidos para exibição.
		 */
		lastFourDigits: {
			type: String,
			required: [true, "Os 4 últimos dígitos são obrigatórios"],
			match: [/^\d{4}$/, "Informe exatamente os 4 últimos dígitos"],
		},
		type: {
			type: String,
			enum: { values: CARD_TYPES, message: "Tipo deve ser credit ou debit" },
			required: true,
		},
		// MUDANÇA (C7): limite em centavos.
		limitInCents: {
			type: Number,
			default: 0,
			min: [0, "Limite não pode ser negativo"],
			validate: {
				validator: Number.isInteger,
				message: "Limite deve ser um inteiro em centavos",
			},
		},
		/**
		 * Dia em que a fatura FECHA (para de aceitar compras novas).
		 *
		 * Só faz sentido em cartão de crédito. Sem ele, as compras seriam
		 * agrupadas por mês do calendário — que é o que o app fazia antes e
		 * nunca batia com o valor cobrado pelo banco.
		 */
		closingDay: {
			type: Number,
			min: 1,
			max: 31,
			default: null,
		},

		/** Dia do vencimento — quando o dinheiro sai da conta. */
		dueDay: {
			type: Number,
			min: 1,
			max: 31,
			default: null,
		},

		color: {
			type: String,
			default: "#1e293b",
			match: [/^#[0-9a-fA-F]{6}$/, "Cor deve estar no formato hexadecimal (#RRGGBB)"],
		},
		bank: {
			type: String,
			trim: true,
			maxlength: 60,
			default: "",
		},

		/**
		 * Cartão favorito: o que vem selecionado no card de Faturas e no
		 * formulário de transação. No máximo um por usuário — ver o índice abaixo.
		 */
		starred: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

/**
 * Cartão de crédito precisa dos dois dias para que a fatura exista.
 * Cartão de débito não tem fatura, então os campos ficam nulos.
 */
BankCardSchema.path("closingDay").validate(function requiresCycleForCredit(value) {
	if (this.type !== "credit") return true;
	// Ou os dois estão preenchidos, ou nenhum (cartão ainda sem ciclo configurado).
	return (value === null) === (this.dueDay === null);
}, "Informe o dia de fechamento e o de vencimento juntos");

/** Um cartão de crédito com ciclo configurado consegue montar faturas. */
BankCardSchema.methods.hasInvoiceCycle = function hasInvoiceCycle() {
	return this.type === "credit" && this.closingDay != null && this.dueDay != null;
};

// Listagem dos cartões do usuário (A4).
BankCardSchema.index({ user: 1, createdAt: -1 });

/**
 * Um único favorito por usuário, garantido pelo banco.
 *
 * Se a regra vivesse só no controller, duas requisições simultâneas marcando
 * cartões diferentes terminariam com dois favoritos. Com o índice único parcial
 * — que só considera os documentos com `starred: true` —, a segunda falha com
 * 409 em vez de deixar o dado inconsistente.
 */
BankCardSchema.index(
	{ user: 1 },
	{ unique: true, partialFilterExpression: { starred: true }, name: "one_starred_per_user" }
);

module.exports = mongoose.model("BankCard", BankCardSchema);
module.exports.CARD_TYPES = CARD_TYPES;
