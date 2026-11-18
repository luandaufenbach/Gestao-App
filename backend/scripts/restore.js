/**
 * Restaura uma cópia feita por `backup.js` (ROADMAP 0.10).
 *
 * Existe porque backup que nunca foi restaurado não é backup, é crença. O
 * aceite do 0.10 pede uma restauração EXECUTADA, em banco separado — e é para
 * isso que este script serve: provar que os arquivos voltam a ser um banco.
 *
 * ── Por que ele NÃO lê a URI do .env ──────────────────────────────────
 *
 * Todos os outros scripts daqui leem `mongoUri` do ambiente. Este não, de
 * propósito: o .env aponta para PRODUÇÃO, e um restore é a operação que
 * sobrescreve dados. Herdar a URI significaria que esquecer um argumento
 * despeja um backup velho por cima dos dados reais de usuários.
 *
 * Então o destino é sempre explícito, digitado por quem roda. Restaurar a
 * produção continua possível — basta passar a URI dela —, mas aí é um ato
 * deliberado, não um descuido.
 *
 *   node scripts/restore.js --from <pasta> --uri <uri>          (simulação)
 *   node scripts/restore.js --from <pasta> --uri <uri> --apply  (grava)
 *
 * Coleção que já tem documentos é pulada, a menos que venha `--force`: juntar
 * backup antigo com dado novo produz um estado que não é nem um nem outro.
 */

const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");
const { EJSON } = require("bson");

const apply = process.argv.includes("--apply");
const force = process.argv.includes("--force");

function argumento(nome) {
	const indice = process.argv.indexOf(nome);

	return indice !== -1 ? process.argv[indice + 1] : null;
}

async function main() {
	const pasta = argumento("--from");
	const uri = argumento("--uri");

	if (!pasta || !uri) {
		console.error("Uso: node scripts/restore.js --from <pasta> --uri <uri> [--apply] [--force]");
		console.error("\nA URI é obrigatória e nunca vem do .env — ver o comentário no topo.");
		process.exit(1);
	}

	const arquivos = fs.readdirSync(pasta).filter((nome) => nome.endsWith(".json"));

	if (arquivos.length === 0) {
		console.error(`Nenhum .json em ${pasta}.`);
		process.exit(1);
	}

	await mongoose.connect(uri);
	console.log(`Destino: ${mongoose.connection.name}\n`);

	let total = 0;

	for (const arquivo of arquivos) {
		const nome = path.basename(arquivo, ".json");
		const documentos = EJSON.parse(fs.readFileSync(path.join(pasta, arquivo), "utf8"));

		if (documentos.length === 0) {
			console.log(`${nome}: vazio no backup, nada a fazer`);
			continue;
		}

		const colecao = mongoose.connection.db.collection(nome);
		const existentes = await colecao.countDocuments();

		if (existentes > 0 && !force) {
			console.log(`${nome}: PULADO — já tem ${existentes} documento(s). Use --force para sobrescrever.`);
			continue;
		}

		console.log(`${nome}: ${documentos.length} documento(s) a restaurar`);

		if (apply) {
			if (existentes > 0) await colecao.deleteMany({});
			await colecao.insertMany(documentos);
			console.log(`  -> restaurados`);
		}

		total += documentos.length;
	}

	console.log(
		apply
			? `\n${total} documento(s) restaurados.`
			: `\nSIMULAÇÃO: ${total} documento(s) seriam restaurados. Rode com --apply.`
	);

	await mongoose.disconnect();
}

main().catch((error) => {
	console.error("Falhou:", error.message);
	process.exit(1);
});
