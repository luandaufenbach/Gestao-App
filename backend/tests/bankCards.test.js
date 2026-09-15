import { describe, it, expect, beforeEach } from "vitest";
import { app, request, createUser, createCreditCard } from "./helpers.js";

/**
 * Cartão favorito.
 *
 * O favorito decide qual cartão vem selecionado no card de Faturas e no
 * formulário de transação, então a regra central é: no máximo um por usuário.
 */

let user;

beforeEach(async () => {
	user = await createUser();
});

const listar = () => user.auth(request(app).get("/bank-cards")).expect(200);

const favoritar = (id, starred = true) =>
	user.auth(request(app).patch(`/bank-cards/${id}`)).send({ starred });

const favoritos = (cards) => cards.filter((card) => card.starred).map((card) => card.name);

describe("cartão favorito", () => {
	it("nasce sem estrela", async () => {
		const card = await createCreditCard(user.token);

		expect(card.starred).toBe(false);
	});

	it("vem primeiro na listagem, mesmo sendo o cartão mais antigo", async () => {
		const antigo = await createCreditCard(user.token, {
			name: "Nubank",
			lastFourDigits: "1111",
		});
		await createCreditCard(user.token, { name: "Inter", lastFourDigits: "2222" });

		await favoritar(antigo._id).expect(200);

		const { body } = await listar();
		expect(body[0].name).toBe("Nubank");
	});

	it("marcar outro cartão tira a estrela do anterior", async () => {
		const a = await createCreditCard(user.token, { name: "A", lastFourDigits: "1111" });
		const b = await createCreditCard(user.token, { name: "B", lastFourDigits: "2222" });

		await favoritar(a._id).expect(200);
		await favoritar(b._id).expect(200);

		const { body } = await listar();
		expect(favoritos(body)).toEqual(["B"]);
	});

	it("criar um cartão já favorito tira a estrela do anterior", async () => {
		await createCreditCard(user.token, { name: "A", lastFourDigits: "1111", starred: true });
		await createCreditCard(user.token, { name: "B", lastFourDigits: "2222", starred: true });

		const { body } = await listar();
		expect(favoritos(body)).toEqual(["B"]);
	});

	it("permite ficar sem favorito", async () => {
		const card = await createCreditCard(user.token, { starred: true });

		await favoritar(card._id, false).expect(200);

		const { body } = await listar();
		expect(favoritos(body)).toEqual([]);
	});

	it("o favorito de um usuário não afeta o de outro", async () => {
		const outro = await createUser();
		const meu = await createCreditCard(user.token, { starred: true });

		await createCreditCard(outro.token, { starred: true });

		const { body } = await listar();
		expect(body.find((card) => card._id === meu._id).starred).toBe(true);
	});

	it("favoritar cartão alheio responde 404 e não mexe no seu favorito", async () => {
		const outro = await createUser();
		const meu = await createCreditCard(user.token, { starred: true });
		const alheio = await createCreditCard(outro.token);

		await favoritar(alheio._id).expect(404);

		// Se a posse fosse conferida depois de limpar os favoritos, a requisição
		// recusada teria apagado a estrela do cartão do próprio usuário.
		const { body } = await listar();
		expect(body.find((card) => card._id === meu._id).starred).toBe(true);
	});

	it("recusa valor que não seja booleano", async () => {
		const card = await createCreditCard(user.token);

		await favoritar(card._id, "sim").expect(400);
	});
});
