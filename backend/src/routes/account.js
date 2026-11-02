const express = require("express");
const rateLimit = require("express-rate-limit");

const { exportAccount, deleteAccount } = require("../controllers/accountController");
const { deleteAccountSchema } = require("../validators/accountValidators");
const validate = require("../middlewares/validate");
const { isTest } = require("../config/env");

const router = express.Router();

/**
 * Limites próprios, os dois bem mais apertados que o global do app.js
 * (1000 requisições por 15 minutos), que não serve para nenhuma das duas rotas.
 *
 * Desativados nos testes, como em routes/auth.js, para não interferir nas
 * asserções.
 */

/**
 * Exportação: varre todo o histórico do usuário por requisição. Sem limite
 * próprio, um laço no cliente transforma a rota em negação de serviço contra o
 * próprio banco. Cinco por hora cobrem com folga o uso legítimo — baixar os
 * próprios dados é algo que se faz uma vez, não em rajada.
 */
const exportLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hora
	max: 5,
	message: { message: "Muitas exportações seguidas. Tente novamente em alguns minutos." },
	standardHeaders: true,
	legacyHeaders: false,
	skip: () => isTest,
});

/**
 * Exclusão: rota de credencial, porque confere senha. O limite aqui barra a
 * força bruta na senha de confirmação — sem ele, quem tivesse o token poderia
 * adivinhar a senha à vontade usando esta rota, e um acerto apaga a conta.
 * Três tentativas por hora deixam margem para erro de digitação e nada além.
 */
const deleteLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hora
	max: 3,
	message: { message: "Muitas tentativas. Tente novamente em alguns minutos." },
	standardHeaders: true,
	legacyHeaders: false,
	skip: () => isTest,
});

router.get("/export", exportLimiter, exportAccount);
router.delete("/", deleteLimiter, validate({ body: deleteAccountSchema }), deleteAccount);

module.exports = router;
