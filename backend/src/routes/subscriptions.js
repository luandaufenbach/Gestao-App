const express = require("express");
const { z } = require("zod");

const {
	getMySubscription,
	subscribe,
	cancelMySubscription,
} = require("../controllers/subscriptionController");
const validate = require("../middlewares/validate");

const router = express.Router();

/**
 * CPF ou CNPJ, só dígitos depois de limpar a máscara.
 *
 * Não validamos o dígito verificador aqui: quem recusa documento inválido é o
 * Asaas, que conhece as regras e as mantém. Repetir a validação significaria
 * duas fontes de verdade divergindo com o tempo. O que fazemos é o que ele não
 * faz por nós: normalizar, para que "123.456.789-09" e "12345678909" sejam a
 * mesma coisa.
 */
const document = z
	.string()
	.transform((value) => value.replace(/\D/g, ""))
	.refine((digits) => digits.length === 11 || digits.length === 14, {
		message: "Informe um CPF com 11 dígitos ou um CNPJ com 14",
	});

router.get("/me", getMySubscription);
router.post("/", validate({ body: z.object({ cpfCnpj: document }).strict() }), subscribe);
router.delete("/", cancelMySubscription);

module.exports = router;
