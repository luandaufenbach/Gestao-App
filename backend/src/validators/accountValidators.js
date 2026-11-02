const { z } = require("zod");

/**
 * Confirmação da exclusão de conta.
 *
 * A senha atual é exigida porque o JWT sozinho não basta aqui: ele vale 7 dias,
 * não é revogável (ver a pendência conhecida em .claude/agents/seguranca-lgpd.md)
 * e fica guardado no navegador. Um token copiado de uma máquina compartilhada
 * apagaria a conta inteira em uma única requisição. A senha é o segundo fator
 * que só o titular tem.
 *
 * Sem as regras de força do cadastro, de propósito: senhas antigas, criadas antes
 * das regras atuais, precisam continuar servindo para confirmar a exclusão.
 */
const deleteAccountSchema = z
	.object({
		password: z.string().min(1, "Senha é obrigatória").max(128),
	})
	.strict();

module.exports = { deleteAccountSchema };
