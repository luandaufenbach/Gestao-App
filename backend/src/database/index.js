const dns = require("dns");
const mongoose = require("mongoose");
const { mongoUri, isProduction, dnsServers } = require("../config/env");

/**
 * Fixa os resolvedores de DNS quando DNS_SERVERS está definida.
 *
 * Só age quando a variável existe; ver o comentário em `config/env.js` para o
 * caso que ela resolve.
 *
 * Exportada, e não mais um efeito de carga do módulo, porque os scripts de
 * `scripts/` conectam direto pelo mongoose, sem passar por `connectDB`. Sem
 * poder chamá-la, eles falham com `querySrv ECONNREFUSED` nas máquinas em que
 * o c-ares não enumera os DNS do sistema — justamente onde a aplicação
 * funciona, o que torna a falha confusa.
 */
function applyDnsServers() {
	if (dnsServers.length > 0) {
		dns.setServers(dnsServers);
	}
}

/**
 * Falhar rápido em vez de enfileirar operações indefinidamente.
 * Sem isso, uma query com o banco fora do ar fica pendurada por 30s (padrão).
 */
mongoose.set("bufferTimeoutMS", 5000);

// Em produção, um campo não declarado no schema deve ser um erro explícito,
// não algo descartado em silêncio.
mongoose.set("strictQuery", true);

/**
 * O destino é um banco na própria máquina?
 *
 * Só `127.0.0.1`, `localhost` e `::1` contam. Qualquer outro host é tratado
 * como banco de verdade de alguém, mesmo que o NODE_ENV diga "development".
 */
function isLocalDatabase(uri = "") {
	return /^mongodb(\+srv)?:\/\/(?:[^@]*@)?(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?(?:[/?]|$)/i.test(
		uri
	);
}

async function connectDB(uri = mongoUri) {
	applyDnsServers();

	mongoose.connection.on("error", (error) => {
		console.error("Erro na conexão com o MongoDB:", error.message);
	});

	mongoose.connection.on("disconnected", () => {
		console.warn("MongoDB desconectado.");
	});

	await mongoose.connect(uri, {
		serverSelectionTimeoutMS: 10_000,
		// Pool dimensionado para uma app pequena; ajuste conforme a carga real.
		maxPoolSize: 10,
		minPoolSize: 1,
	});

	/**
	 * Sincroniza os índices declarados nos schemas com o banco.
	 *
	 * MOTIVO (A4): antes não havia índice nenhum e toda consulta fazia
	 * collection scan. Em produção o ideal é criar os índices por migração
	 * controlada — syncIndexes em uma base grande pode travar a aplicação.
	 *
	 * A guarda olha o DESTINO, não o modo.
	 *
	 * Checar só `isProduction` não bastava: o .env de desenvolvimento aponta
	 * para o banco de produção, então `npm run dev` sincronizava índices na
	 * base real. E `syncIndexes` não apenas cria — ele APAGA do banco todo
	 * índice ausente do schema. Subir uma branch antiga localmente derrubava,
	 * em silêncio, índices que a produção usa, e as consultas voltavam a varrer
	 * a coleção inteira sem erro nenhum para denunciar.
	 *
	 * Fora de um banco local, o caminho é `scripts/createIndexes.js`, que só
	 * cria e nunca apaga.
	 */
	if (!isProduction && isLocalDatabase(uri)) {
		await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).syncIndexes()));
	} else if (!isProduction) {
		console.warn(
			"Índices NÃO sincronizados: o banco não é local. Use scripts/createIndexes.js."
		);
	}

	console.log("MongoDB conectado");
	return mongoose.connection;
}

async function disconnectDB() {
	await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB, applyDnsServers, isLocalDatabase };
