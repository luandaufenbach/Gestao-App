const { z } = require("zod");

/**
 * Requisitos mínimos de senha.
 *
 * 8 caracteres com letra e número é um piso razoável sem virar um obstáculo.
 * O limite superior de 128 existe porque o bcrypt trunca em 72 bytes e senhas
 * gigantes só servem para gastar CPU do servidor.
 */
const password = z
	.string()
	.min(8, "A senha deve ter pelo menos 8 caracteres")
	.max(128, "A senha deve ter no máximo 128 caracteres")
	.regex(/[a-zA-Z]/, "A senha deve conter pelo menos uma letra")
	.regex(/[0-9]/, "A senha deve conter pelo menos um número");

/**
 * Token recebido por e-mail (recuperação de senha, verificação de endereço).
 *
 * São 32 bytes em hexadecimal (64 caracteres), mas o formato não é conferido
 * aqui de propósito: quem decide é a busca pelo hash, no controller, para que
 * todo token recusado receba a mesma mensagem. Conferir o formato aqui separaria
 * "token malformado" (400 de validação, com `details`) de "token que não existe"
 * (400 do controller), e essa diferença já conta algo a quem está testando
 * tokens. O limite de tamanho existe só para não levar lixo ao banco.
 */
const emailedToken = z.string().trim().min(1, "Token é obrigatório").max(256);

const registerSchema = z
	.object({
		name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(120),
		email: z.string().trim().toLowerCase().email("E-mail inválido").max(254),
		password,
	})
	.strict();

const loginSchema = z
	.object({
		email: z.string().trim().toLowerCase().email("E-mail inválido").max(254),
		// Sem as regras de força aqui: senhas antigas devem continuar podendo logar.
		password: z.string().min(1, "Senha é obrigatória").max(128),
	})
	.strict();

const forgotPasswordSchema = z
	.object({
		email: z.string().trim().toLowerCase().email("E-mail inválido").max(254),
	})
	.strict();

const resetPasswordSchema = z
	.object({
		token: emailedToken,
		// A mesma senha do cadastro: a recuperação não pode ser a porta dos fundos
		// para cadastrar uma senha fraca.
		password,
	})
	.strict();

const verifyEmailSchema = z
	.object({
		token: emailedToken,
	})
	.strict();

module.exports = {
	registerSchema,
	loginSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	verifyEmailSchema,
};
