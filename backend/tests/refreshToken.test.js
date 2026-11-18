import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { app, request, createUser } from "./helpers.js";

/**
 * Sessão renovável (ROADMAP 0.9).
 *
 * O que estes testes protegem: o token de acesso é curto, a sessão continua
 * sem novo login, e sair da conta encerra a sessão NO SERVIDOR — que era
 * exatamente o que não acontecia quando o JWT valia 7 dias e nada o revogava.
 */

// Os models vêm do registro do Mongoose; importar o arquivo direto recompila
// o schema e quebra com "Cannot overwrite model once compiled".
const RefreshToken = mongoose.model("RefreshToken");
const User = mongoose.model("User");

const UM_TOKEN_QUALQUER = "a".repeat(64);

describe("token de acesso", () => {
	it("expira em 15 minutos, não mais em 7 dias", async () => {
		const { token } = await createUser();
		const { iat, exp } = jwt.decode(token);

		expect(exp - iat).toBe(15 * 60);
	});
});

describe("POST /auth/refresh", () => {
	it("devolve um par novo e mantém o acesso funcionando", async () => {
		const { refreshToken } = await createUser();

		const renovado = await request(app)
			.post("/auth/refresh")
			.send({ refreshToken })
			.expect(200);

		expect(renovado.body.token).toBeTypeOf("string");
		expect(renovado.body.refreshToken).toBeTypeOf("string");
		expect(renovado.body.refreshToken).not.toBe(refreshToken);

		// O acesso novo vale de verdade, não só na aparência.
		await request(app)
			.get("/auth/me")
			.set("Authorization", `Bearer ${renovado.body.token}`)
			.expect(200);
	});

	it("aposenta o token usado: ele não serve uma segunda vez", async () => {
		const { refreshToken } = await createUser();

		await request(app).post("/auth/refresh").send({ refreshToken }).expect(200);
		await request(app).post("/auth/refresh").send({ refreshToken }).expect(401);
	});

	/**
	 * O caso que justifica a rotação existir.
	 *
	 * Token já trocado que reaparece significa duas cópias em circulação. Como
	 * não dá para saber qual é a do dono, todas as sessões caem.
	 */
	it("reúso de token derruba TODAS as sessões do usuário", async () => {
		const { refreshToken, user } = await createUser();

		// Uma segunda sessão, como se fosse outro aparelho.
		const outraSessao = await request(app)
			.post("/auth/login")
			.send({ email: user.email, password: "senha1234" })
			.expect(200);

		const novo = await request(app)
			.post("/auth/refresh")
			.send({ refreshToken })
			.expect(200);

		// O ladrão chega com a cópia velha.
		await request(app).post("/auth/refresh").send({ refreshToken }).expect(401);

		// E agora nem o token recém-emitido nem o do outro aparelho valem.
		await request(app)
			.post("/auth/refresh")
			.send({ refreshToken: novo.body.refreshToken })
			.expect(401);

		await request(app)
			.post("/auth/refresh")
			.send({ refreshToken: outraSessao.body.refreshToken })
			.expect(401);
	});

	it("recusa token expirado e apaga o registro", async () => {
		const { refreshToken } = await createUser();

		await RefreshToken.updateOne({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });

		await request(app).post("/auth/refresh").send({ refreshToken }).expect(401);
		expect(await RefreshToken.countDocuments()).toBe(0);
	});

	it("recusa token desconhecido", async () => {
		await request(app)
			.post("/auth/refresh")
			.send({ refreshToken: UM_TOKEN_QUALQUER })
			.expect(401);
	});

	it("recusa corpo malformado antes de consultar o banco", async () => {
		await request(app).post("/auth/refresh").send({ refreshToken: "curto" }).expect(400);
		await request(app).post("/auth/refresh").send({}).expect(400);
	});
});

describe("POST /auth/logout", () => {
	it("encerra a sessão no servidor, não só no navegador", async () => {
		const { refreshToken } = await createUser();

		await request(app).post("/auth/logout").send({ refreshToken }).expect(204);
		await request(app).post("/auth/refresh").send({ refreshToken }).expect(401);
	});

	it("derruba só o aparelho que saiu", async () => {
		const { refreshToken, user } = await createUser();

		const outraSessao = await request(app)
			.post("/auth/login")
			.send({ email: user.email, password: "senha1234" })
			.expect(200);

		await request(app).post("/auth/logout").send({ refreshToken }).expect(204);

		await request(app)
			.post("/auth/refresh")
			.send({ refreshToken: outraSessao.body.refreshToken })
			.expect(200);
	});

	it("responde 204 mesmo com token desconhecido", async () => {
		await request(app)
			.post("/auth/logout")
			.send({ refreshToken: UM_TOKEN_QUALQUER })
			.expect(204);
	});
});

describe("sessões e mudança de credencial", () => {
	/**
	 * Quem redefine a senha costuma estar reagindo a uma invasão. Se as sessões
	 * antigas continuassem valendo, o gesto não serviria para nada.
	 */
	it("redefinir a senha derruba todas as sessões", async () => {
		const { refreshToken, user } = await createUser();

		const doc = await User.findById(user.id);
		const tokenDoEmail = doc.createPasswordResetToken();
		await doc.save();

		await request(app)
			.post("/auth/reset-password")
			.send({ token: tokenDoEmail, password: "outrasenha1234" })
			.expect(200);

		await request(app).post("/auth/refresh").send({ refreshToken }).expect(401);
	});

	it("excluir a conta leva as sessões junto", async () => {
		const { refreshToken, token } = await createUser();

		await request(app)
			.delete("/account")
			.set("Authorization", `Bearer ${token}`)
			.send({ password: "senha1234" })
			.expect(200);

		expect(await RefreshToken.countDocuments()).toBe(0);
		await request(app).post("/auth/refresh").send({ refreshToken }).expect(401);
	});
});
