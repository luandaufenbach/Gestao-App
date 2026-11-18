/**
 * Cópia de segurança do banco inteiro, em arquivos locais (ROADMAP 0.10).
 *
 * MOTIVO: o cluster do Atlas está no tier gratuito, onde não existe backup
 * automático. Há dados financeiros de gente real ali e, hoje, nenhuma cópia.
 * Este script é o caminho que não depende de upgrade nem de instalar nada:
 * roda com o que o projeto já tem.
 *
 * Grava **Extended JSON**, não JSON comum. É o que preserva os tipos do
 * MongoDB: `JSON.stringify` transformaria `ObjectId` e `Date` em texto, e a
 * restauração devolveria documentos com os tipos errados — datas que não
 * entram em intervalo de mês, referências que não casam com nenhum `_id`. Um
 * backup que não restaura direito é pior que nenhum, porque dá confiança.
 *
 * LIMITE, dito com todas as letras: é uma exportação lógica, coleção por
 * coleção, não um snapshot instantâneo. Se alguém gravar DURANTE a cópia, o
 * conjunto pode ficar levemente desencontrado entre coleções. No volume deste
 * app é desprezível; numa base movimentada, não seria.
 *
 *   node scripts/backup.js                 (grava em ./backups/<data>)
 *   node scripts/backup.js --out /caminho  (grava onde você mandar)
 */
require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");
const { EJSON } = require("bson");
const { mongoUri } = require("../src/config/env");
const { applyDnsServers } = require("../src/database");

function destino() {
	const indice = process.argv.indexOf("--out");
	const base =
		indice !== -1 && process.argv[indice + 1]
			? process.argv[indice + 1]
			: path.join(__dirname, "..", "backups");

	// Carimbo em UTC, sem os dois-pontos que o Windows recusa em nome de arquivo.
	const carimbo = new Date().toISOString().replace(/[:.]/g, "-");

	return path.join(base, carimbo);
}

async function main() {
	applyDnsServers();
	await mongoose.connect(mongoUri);

	const pasta = destino();
	fs.mkdirSync(pasta, { recursive: true });

	const colecoes = await mongoose.connection.db.listCollections().toArray();
	let total = 0;

	for (const { name } of colecoes) {
		const documentos = await mongoose.connection.db.collection(name).find({}).toArray();

		fs.writeFileSync(
			path.join(pasta, `${name}.json`),
			EJSON.stringify(documentos, null, 2, { relaxed: false })
		);

		console.log(`${name}: ${documentos.length} documento(s)`);
		total += documentos.length;
	}

	console.log(`\n${total} documento(s) em ${colecoes.length} coleção(ões).`);
	console.log(`Gravado em: ${pasta}`);
	console.log("\nRestaure com: node scripts/restore.js --from <pasta> --apply");

	await mongoose.disconnect();
}

main().catch((error) => {
	console.error("Falhou:", error.message);
	process.exit(1);
});
