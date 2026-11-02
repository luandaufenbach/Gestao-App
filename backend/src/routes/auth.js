const express = require("express");
const rateLimit = require("express-rate-limit");

const {
	register,
	login,
	me,
	forgotPassword,
	resetPassword,
	verifyEmail,
	resendVerification,
} = require("../controllers/authController");
const {
	registerSchema,
	loginSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	verifyEmailSchema,
} = require("../validators/authValidators");
const validate = require("../middlewares/validate");
const authenticate = require("../middlewares/auth");
const { isTest } = require("../config/env");

const router = express.Router();

/**
 * Rate limit específico para as rotas de credenciais.
 *
 * MOTIVO: sem isso, /auth/login aceita força bruta ilimitada e /auth/register
 * permite criar contas em massa. O limite global do app.js é bem mais alto e
 * não serviria aqui.
 *
 * As rotas de recuperação entram no mesmo limite: /auth/forgot-password sem
 * limite é uma máquina de spam contra o e-mail de terceiros, e /auth/reset-password
 * sem limite aceita força bruta no token.
 *
 * As de verificação de e-mail, idem: /auth/verify-email sem limite aceita força
 * bruta no token, e /auth/resend-verification sem limite vira spam contra o
 * e-mail do próprio usuário — um laço no cliente dispara um e-mail por
 * requisição, e é o endereço dele que acaba marcado como remetente abusivo.
 *
 * Desativado nos testes para não interferir nas asserções.
 */
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutos
	max: 10,
	message: { message: "Muitas tentativas. Tente novamente em alguns minutos." },
	standardHeaders: true,
	legacyHeaders: false,
	skip: () => isTest,
});

router.post("/register", authLimiter, validate({ body: registerSchema }), register);
router.post("/login", authLimiter, validate({ body: loginSchema }), login);
router.post(
	"/forgot-password",
	authLimiter,
	validate({ body: forgotPasswordSchema }),
	forgotPassword
);
router.post(
	"/reset-password",
	authLimiter,
	validate({ body: resetPasswordSchema }),
	resetPassword
);
router.post("/verify-email", authLimiter, validate({ body: verifyEmailSchema }), verifyEmail);
/**
 * O limitador vem ANTES do `authenticate`, de propósito: assim a requisição
 * conta para o limite mesmo quando o token é inválido. Na ordem inversa, quem
 * mandasse token ruim gastaria uma consulta ao banco por requisição sem nunca
 * encostar no limite.
 */
router.post("/resend-verification", authLimiter, authenticate, resendVerification);
router.get("/me", authenticate, me);

module.exports = router;
