const { initMonitoring, flushMonitoring } = require("./config/monitoring");

/**
 * Antes de qualquer require da aplicação: a instrumentação automática do SDK
 * envolve os módulos no momento em que são carregados, e o Express carregado
 * antes dela ficaria de fora.
 */
initMonitoring();

const { port, nodeEnv } = require("./config/env");
const app = require("./app");
const { connectDB, disconnectDB } = require("./database/index");

let server;

async function start() {
	await connectDB();

	server = app.listen(port, () => {
		console.log(`Servidor rodando na porta ${port} (${nodeEnv})`);
	});
}

/**
 * Encerramento controlado.
 *
 * MOTIVO: antes o processo morria imediatamente ao receber SIGTERM (o que
 * acontece em todo deploy), cortando requisições em andamento no meio e
 * deixando a conexão do Mongo pendurada. Aqui paramos de aceitar conexões
 * novas, esperamos as em andamento terminarem e só então fechamos o banco.
 */
async function shutdown(signal) {
	console.log(`\n${signal} recebido, encerrando...`);

	const forceExit = setTimeout(() => {
		console.error("Encerramento demorou demais, forçando saída.");
		process.exit(1);
	}, 10_000);
	// Não segura o event loop se tudo fechar antes do prazo.
	forceExit.unref();

	try {
		if (server) {
			await new Promise((resolve, reject) => {
				server.close((error) => (error ? reject(error) : resolve()));
			});
		}
		// Antes de fechar: o envio é assíncrono, e o erro que derrubou a
		// instância é justamente o que se perderia aqui.
		await flushMonitoring();
		await disconnectDB();
		console.log("Encerrado com sucesso.");
		process.exit(0);
	} catch (error) {
		console.error("Erro ao encerrar:", error.message);
		process.exit(1);
	}
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Um erro não tratado deixa o processo em estado desconhecido. Logar e sair
// é mais seguro do que seguir servindo requisições com estado corrompido.
process.on("unhandledRejection", (reason) => {
	console.error("Promise rejeitada sem tratamento:", reason);
	shutdown("unhandledRejection");
});

start().catch((error) => {
	console.error("Falha ao iniciar o servidor:", error.message);
	process.exit(1);
});
