import { describe, it, expect, beforeAll, afterEach } from "vitest";
import express from "express";
import request from "supertest";

import { createRequire } from "node:module";

/**
 * Os módulos da aplicação entram por `require`, não por `import`.
 *
 * MOTIVO: o código é CommonJS, e o Vitest carrega o mesmo arquivo duas vezes
 * quando ele chega por caminhos diferentes — uma cópia para o `import` do
 * teste, outra para o `require` interno de quem o usa. As duas cópias não
 * compartilham estado: o `initMonitoring` do teste ligava uma, e o
 * `errorHandler` consultava a outra, que seguia desligada. Pelo mesmo motivo
 * um `AppError` criado aqui não passava no `instanceof` de lá, e um 404 virava
 * 500. Carregando tudo pelo registro do Node, há uma instância só.
 */
const require = createRequire(import.meta.url);
const { initMonitoring, reportServerError, flushMonitoring } = require("../src/config/monitoring");
const { errorHandler } = require("../src/middlewares/errorHandler");
const AppError = require("../src/utils/AppError");

/**
 * O SDK do Sentry de verdade, com um transporte que guarda o envelope em
 * memória em vez de mandar pela rede.
 *
 * Preferimos isto a espionar a função de captura porque o que nos interessa é
 * o que SAIRIA daqui: se o `beforeSend` removeu o corpo da requisição, se o id
 * do usuário sobreviveu, se o stack foi junto. Um mock da captura responderia
 * "chamei", que é a pergunta errada.
 */
const envelopes = [];

const transporteEmMemoria = () => ({
	send: async (envelope) => {
		envelopes.push(envelope);
		return {};
	},
	flush: async () => true,
});

/** Um envelope é [cabecalho, [[cabecalhoDoItem, conteudo], ...]]. */
function eventos() {
	return envelopes.flatMap(([, itens]) =>
		itens.filter(([cabecalho]) => cabecalho.type === "event").map(([, conteudo]) => conteudo)
	);
}

const USER_ID = "507f1f77bcf86cd799439011";
const SEGREDO = "descricao-que-nao-pode-vazar";

function appDeTeste() {
	const app = express();
	app.use(express.json());

	// Em produção quem preenche isto é o middleware `authenticate`.
	app.use((req, res, next) => {
		req.userId = USER_ID;
		next();
	});

	app.post("/estoura", (req, res, next) => next(new Error("falha inesperada no calculo")));
	app.get("/inexistente", (req, res, next) => next(AppError.notFound("nada aqui")));
	app.get("/invalido", (req, res, next) => next(AppError.badRequest("campo errado")));

	app.use(errorHandler);
	return app;
}

describe("monitoramento de erro", () => {
	beforeAll(() => {
		const ligou = initMonitoring({
			dsn: "https://chavefalsa@o0.ingest.sentry.io/0",
			transport: transporteEmMemoria,
		});
		expect(ligou).toBe(true);
	});

	afterEach(() => {
		envelopes.length = 0;
	});

	it("notifica o 500 com stack e com o id de quem o encontrou", async () => {
		await request(appDeTeste())
			.post("/estoura")
			.send({ valueInCents: 123456, description: SEGREDO })
			.expect(500);

		await flushMonitoring();

		const capturados = eventos();
		expect(capturados).toHaveLength(1);

		const [evento] = capturados;
		const excecao = evento.exception.values[0];

		expect(excecao.type).toBe("Error");
		expect(excecao.value).toBe("falha inesperada no calculo");
		// O aceite do roteiro pede o stack, não só a mensagem.
		expect(excecao.stacktrace.frames.length).toBeGreaterThan(0);
		expect(evento.user).toEqual({ id: USER_ID });
		expect(evento.contexts.requisicao).toMatchObject({ metodo: "POST", rota: "/estoura" });
	});

	it("não deixa o corpo da requisição ir junto", async () => {
		await request(appDeTeste())
			.post("/estoura")
			.set("Authorization", "Bearer token-que-nao-pode-vazar")
			.send({ valueInCents: 123456, description: SEGREDO })
			.expect(500);

		await flushMonitoring();

		const serializado = JSON.stringify(eventos());
		expect(serializado).not.toContain(SEGREDO);
		expect(serializado).not.toContain("token-que-nao-pode-vazar");
		expect(serializado).not.toContain("123456");
	});

	it("ignora os erros previstos, que já têm resposta própria", async () => {
		await request(appDeTeste()).get("/inexistente").expect(404);
		await request(appDeTeste()).get("/invalido").expect(400);

		await flushMonitoring();

		expect(eventos()).toHaveLength(0);
	});

	it("reporta sem usuário quando a falha acontece antes da autenticação", async () => {
		reportServerError(new Error("falha antes do login"), {
			method: "GET",
			originalUrl: "/health",
		});

		await flushMonitoring();

		const [evento] = eventos();
		expect(evento.exception.values[0].value).toBe("falha antes do login");
		expect(evento.user).toBeUndefined();
	});
});
