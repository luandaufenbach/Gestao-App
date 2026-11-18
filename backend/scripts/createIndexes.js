/**
 * Cria no banco os índices declarados nos schemas.
 *
 * MOTIVO: `connectDB` sincroniza índices apenas FORA de produção — em uma base
 * grande, fazer isso no boot pode travar a aplicação. A consequência é que todo
 * índice novo precisa de um passo explícito em produção, e sem ele o índice
 * simplesmente não existe lá.
 *
 * Foi o caso da coleção de sessões (ROADMAP 0.9): sem o índice TTL, sessão
 * vencida nunca é apagada e a coleção cresce sem limite. O vencimento em si
 * continua valendo, porque é conferido no código — mas a faxina, não.
 *
 * Usa `createIndexes`, NUNCA `syncIndexes`: o segundo APAGA do banco todo
 * índice que não esteja no schema. Rodar isso contra produção com um schema
 * desatualizado derrubaria índices em uso, e a aplicação passaria a varrer
 * coleção inteira sem avisar ninguém.
 *
 * Criar índice é aditivo e idempotente: rodar duas vezes não faz nada na
 * segunda. Ainda assim a simulação é o padrão, como nos outros scripts daqui.
 *
 *   node scripts/createIndexes.js          (simulação, não cria)
 *   node scripts/createIndexes.js --apply  (cria)
 */
require("dotenv").config();

const mongoose = require("mongoose");
const { mongoUri } = require("../src/config/env");
const { applyDnsServers } = require("../src/database");

// Os models precisam ser carregados para se registrarem no mongoose.
require("../src/models/User");
require("../src/models/Category");
require("../src/models/Transaction");
require("../src/models/BankCard");
require("../src/models/Goal");
require("../src/models/RefreshToken");
require("../src/models/WebhookEvent");

const apply = process.argv.includes("--apply");

async function main() {
	applyDnsServers();
	await mongoose.connect(mongoUri);

	for (const nome of mongoose.modelNames()) {
		const model = mongoose.model(nome);

		const noBanco = await model.collection
			.indexes()
			.then((lista) => lista.map((indice) => indice.name))
			.catch(() => []); // coleção que ainda não existe

		const declarados = model.schema.indexes();
		const faltando = declarados.length + 1 - noBanco.length; // +1 pelo _id_

		if (faltando > 0 || noBanco.length === 0) {
			console.log(`${nome}: ${noBanco.length} índice(s) no banco, ${declarados.length} declarado(s) no schema`);

			if (apply) {
				await model.createIndexes();
				console.log(`  -> criados`);
			}
		} else {
			console.log(`${nome}: em dia`);
		}
	}

	console.log(apply ? "\nÍndices criados." : "\nSIMULAÇÃO. Rode com --apply para criar.");

	await mongoose.disconnect();
}

main().catch((error) => {
	console.error("Falhou:", error.message);
	process.exit(1);
});
