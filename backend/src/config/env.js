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
	jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
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
	isProduction: process.env.NODE_ENV === "production",
	isTest: process.env.NODE_ENV === "test",
};
