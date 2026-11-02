const { appUrl, mailProvider, mailApiKey, mailFrom } = require("../config/env");

/**
 * Adaptador de envio de e-mail — não é uma integração.
 *
 * O objetivo é que os fluxos que dependem de e-mail — recuperação de senha e
 * verificação de endereço — funcionem de ponta a ponta sem depender de contrato
 * com provedor nenhum. Enquanto MAIL_PROVIDER estiver vazio, o link é apenas
 * registrado no console: dá para testar o fluxo inteiro em desenvolvimento,
 * copiando o link do terminal.
 *
 * Quando houver provedor, só a função `deliver` muda (ver PONTO DE EXTENSÃO
 * abaixo). Nem o controller nem as rotas precisam saber qual provedor é.
 */

/** Monta um link do frontend com o token na query. A tela é do frontend, não da API. */
function buildTokenUrl(path, token) {
	// Remove barras finais de APP_URL para não gerar "//reset-password".
	const base = appUrl.replace(/\/+$/, "");
	return `${base}/${path}?token=${encodeURIComponent(token)}`;
}

/** Link da tela de redefinição de senha. */
function buildPasswordResetUrl(token) {
	return buildTokenUrl("reset-password", token);
}

/** Link da tela de confirmação de e-mail. */
function buildEmailVerificationUrl(token) {
	return buildTokenUrl("verify-email", token);
}

/**
 * PONTO DE EXTENSÃO — envio real.
 *
 * Para plugar um provedor, implemente o case correspondente e nada mais.
 * Exemplo com Resend (MAIL_PROVIDER=resend, MAIL_API_KEY, MAIL_FROM):
 *
 *   if (mailProvider === "resend") {
 *     const response = await fetch("https://api.resend.com/emails", {
 *       method: "POST",
 *       headers: {
 *         Authorization: `Bearer ${mailApiKey}`,
 *         "Content-Type": "application/json",
 *       },
 *       body: JSON.stringify({ from: mailFrom, to, subject, html }),
 *     });
 *     if (!response.ok) throw new Error(`Resend respondeu ${response.status}`);
 *     return;
 *   }
 *
 * O mesmo vale para SES (via @aws-sdk/client-ses) ou SMTP (via nodemailer):
 * um case novo aqui, mais as variáveis de ambiente em config/env.js.
 *
 * Contrato: lançar em caso de falha. Quem chama trata (ver sendPasswordResetEmail).
 */
async function deliver({ to, subject, text }) {
	if (!mailProvider) {
		// Modo desenvolvimento: sem provedor configurado, o "envio" é um log.
		// É o que permite testar o fluxo inteiro sem contratar provedor — basta
		// copiar o link do terminal. Também é o que o teste automatizado observa.
		console.log(
			`[mailer] Nenhum MAIL_PROVIDER configurado; e-mail não enviado.\n` +
				`[mailer] Para: ${to}\n` +
				`[mailer] Assunto: ${subject}\n` +
				`[mailer] ${text}`
		);
		return { delivered: false, reason: "sem-provedor" };
	}

	// Nenhum provedor implementado ainda. Falhar explicitamente é melhor que
	// fingir envio: uma configuração errada em produção precisa aparecer no log.
	throw new Error(
		`MAIL_PROVIDER="${mailProvider}" não tem implementação em utils/mailer.js` +
			(mailApiKey ? "" : " (MAIL_API_KEY também está vazia)") +
			(mailFrom ? "" : " (MAIL_FROM também está vazia)")
	);
}

/**
 * Envia o e-mail de recuperação de senha.
 *
 * NUNCA lança. Uma falha de envio não pode quebrar a resposta de
 * /auth/forgot-password: a rota responde sempre a mesma coisa, e um erro
 * propagado aqui transformaria o tempo (ou o status) da resposta em um detector
 * de quais e-mails existem na base.
 *
 * Devolve o link gerado, para que o chamador possa registrá-lo em
 * desenvolvimento. O token em claro não é persistido em lugar nenhum.
 */
async function sendPasswordResetEmail({ to, token }) {
	const resetUrl = buildPasswordResetUrl(token);
	const subject = "Recuperação de senha — Gestão App";
	const text =
		`Você pediu para redefinir sua senha.\n\n` +
		`Abra o link abaixo para escolher uma nova senha. Ele vale por 1 hora e só\n` +
		`pode ser usado uma vez:\n\n${resetUrl}\n\n` +
		`Se não foi você, ignore este e-mail: sua senha atual continua valendo.`;

	try {
		const result = await deliver({ to, subject, text });
		return { resetUrl, ...result };
	} catch (error) {
		console.error("[mailer] falha ao enviar e-mail de recuperação", {
			to,
			provider: mailProvider || "nenhum",
			message: error?.message,
		});
		return { resetUrl, delivered: false, reason: "erro-no-envio" };
	}
}

/**
 * Envia o e-mail de verificação de endereço.
 *
 * NUNCA lança, mesmo contrato do `sendPasswordResetEmail` e pelo mesmo motivo
 * levado um passo adiante: esta função é chamada dentro de
 * `POST /auth/register`. Um erro propagado daqui faria o cadastro responder 500
 * DEPOIS de a conta já estar criada no banco — o usuário veria falha, tentaria
 * de novo e receberia "já existe uma conta com esse e-mail", sem ter nenhuma
 * forma de entrar. Provedor fora do ar não pode custar a conta; custa só o
 * e-mail, que o usuário pede de novo em /auth/resend-verification.
 *
 * Devolve o link gerado, para que o chamador possa registrá-lo em
 * desenvolvimento. O token em claro não é persistido em lugar nenhum.
 */
async function sendEmailVerification({ to, token }) {
	const verificationUrl = buildEmailVerificationUrl(token);
	const subject = "Confirme seu e-mail — Gestão App";
	const text =
		`Bem-vindo ao Gestão App.\n\n` +
		`Abra o link abaixo para confirmar que este endereço é seu. Ele vale por 24\n` +
		`horas e só pode ser usado uma vez:\n\n${verificationUrl}\n\n` +
		`Se não foi você quem se cadastrou, ignore este e-mail.`;

	try {
		const result = await deliver({ to, subject, text });
		return { verificationUrl, ...result };
	} catch (error) {
		console.error("[mailer] falha ao enviar e-mail de verificação", {
			to,
			provider: mailProvider || "nenhum",
			message: error?.message,
		});
		return { verificationUrl, delivered: false, reason: "erro-no-envio" };
	}
}

module.exports = {
	sendPasswordResetEmail,
	buildPasswordResetUrl,
	sendEmailVerification,
	buildEmailVerificationUrl,
};
