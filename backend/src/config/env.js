require("dotenv").config();

/**
 * Valida as variáveis de ambiente na inicialização.
 *
 * Motivo: antes, uma MONGO_URI ausente só falhava no meio da conexão e um
 * JWT_SECRET ausente falharia silenciosamente em runtime, ao assinar o token.
 * Falhar aqui, no boot, torna o erro óbvio e impossível de ignorar.
 */
const required = ["MONGO_URI", "JWT_SECRET"];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
	console.error(
		`Variáveis de ambiente obrigatórias ausentes: ${missing.join(", ")}.\n` +
			"Copie backend/.env.example para backend/.env e preencha os valores."
	);
	process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
	console.error(
		"JWT_SECRET deve ter pelo menos 32 caracteres para ser seguro.\n" +
			"Gere um com: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
	);
	process.exit(1);
}

module.exports = {
	nodeEnv: process.env.NODE_ENV || "development",
	port: Number(process.env.PORT) || 3000,
	mongoUri: process.env.MONGO_URI,
	jwtSecret: process.env.JWT_SECRET,
	/**
	 * Validade do token de ACESSO (ROADMAP 0.9).
	 *
	 * Era 7 dias, e um JWT não é revogável: o que foi assinado vale até vencer,
	 * aconteça o que acontecer do lado do servidor. Sete dias de validade eram
	 * sete dias de acesso para quem copiasse o token, e "sair da conta" era só
	 * apagá-lo do próprio navegador.
	 *
	 * Quinze minutos é a janela que sobra desse risco. A sessão longa agora vive
	 * no refresh token, que é revogável porque mora no banco.
	 */
	jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",

	/**
	 * Validade da sessão renovável, em dias.
	 *
	 * É quanto tempo a pessoa pode ficar sem abrir o app e ainda assim voltar
	 * sem digitar a senha. Trinta dias é o compromisso: curto o bastante para
	 * que uma sessão esquecida num aparelho velho não valha para sempre, longo
	 * o bastante para não transformar o app em um pedinte de senha.
	 */
	refreshExpiresInDays: Number(process.env.REFRESH_EXPIRES_IN_DAYS) || 30,
	/**
	 * Endereço público do frontend, usado para montar os links enviados por
	 * e-mail (recuperação de senha). Sem isto o link do e-mail apontaria para a
	 * própria API, que não tem tela nenhuma.
	 */
	appUrl: process.env.APP_URL || "http://localhost:5173",
	/**
	 * Provedor de e-mail transacional. Vazio = modo desenvolvimento: o mailer
	 * só registra o link no console, sem enviar nada (ver src/utils/mailer.js).
	 */
	mailProvider: (process.env.MAIL_PROVIDER || "").trim().toLowerCase(),
	mailApiKey: process.env.MAIL_API_KEY || "",
	mailFrom: process.env.MAIL_FROM || "",
	// Lista de origens permitidas no CORS, separadas por vírgula.
	corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173")
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean),
	/**
	 * Servidores DNS a forçar no resolvedor interno do Node, separados por vírgula.
	 *
	 * Motivo: `mongodb+srv://` exige uma consulta SRV, que o Node faz pelo c-ares
	 * (`dns.resolveSrv`) e não pelo resolvedor do sistema operacional. Em algumas
	 * máquinas Windows o c-ares não consegue enumerar os DNS configurados e cai no
	 * fallback `127.0.0.1`, onde nada responde — a conexão falha com
	 * `querySrv ECONNREFUSED` mesmo com a rede e o `nslookup` funcionando.
	 *
	 * Deixe vazio para usar o comportamento padrão do Node.
	 */
	dnsServers: (process.env.DNS_SERVERS || "")
		.split(",")
		.map((server) => server.trim())
		.filter(Boolean),
	/**
	 * DSN do Sentry. VAZIO = monitoramento desligado: nenhuma chamada de rede.
	 * É o padrão em desenvolvimento e em teste (ver src/config/monitoring.js).
	 */
	sentryDsn: (process.env.SENTRY_DSN || "").trim(),
	/**
	 * Liga o paywall. Desligado = todo recurso pago fica aberto, que é o padrão
	 * enquanto não existe forma de pagar (ver middlewares/requirePaidPlan.js).
	 */
	paywallEnabled: process.env.PAYWALL_ENABLED === "true",

	/**
	 * Quando o paywall passou a valer (ROADMAP 2.4).
	 *
	 * Quem já usava o app antes desta data não perde nada de um dia para o
	 * outro: ganha um período de cortesia para decidir com calma. Cobrar
	 * retroativamente de quem entrou quando tudo era grátis é a forma mais
	 * rápida de perder justamente os usuários que mais têm a dizer sobre o
	 * produto — e são eles que respondem se o preço faz sentido.
	 *
	 * Vazia desliga a cortesia: numa base nova, ninguém é antigo.
	 */
	paywallStartsAt: process.env.PAYWALL_STARTS_AT
		? new Date(process.env.PAYWALL_STARTS_AT)
		: null,

	/**
	 * Asaas (ROADMAP 2.2). VAZIO = assinatura indisponível, e tentar assinar
	 * falha com mensagem clara em vez de um 401 do provedor.
	 *
	 * A chave de sandbox NÃO funciona em produção e vice-versa, por isso a base
	 * acompanha o ambiente: errar o par é o engano mais comum da integração.
	 */
	asaasApiKey: (process.env.ASAAS_API_KEY || "").trim(),
	asaasBaseUrl:
		process.env.ASAAS_ENV === "production"
			? "https://api.asaas.com/v3"
			: "https://api-sandbox.asaas.com/v3",
	/**
	 * Token que o Asaas devolve no header `asaas-access-token`, provando que a
	 * notificação veio dele. Sem ele configurado, o webhook recusa tudo: um
	 * endpoint que muda assinatura não pode ficar aberto à internet.
	 */
	asaasWebhookToken: (process.env.ASAAS_WEBHOOK_TOKEN || "").trim(),

	isProduction: process.env.NODE_ENV === "production",
	isTest: process.env.NODE_ENV === "test",
};
