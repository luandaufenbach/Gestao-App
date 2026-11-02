import { http } from "./http";

/**
 * Camada de acesso à API.
 *
 * Todos os valores monetários trafegam em CENTAVOS (inteiros) — ver
 * backend/src/utils/money.js e src/services/useFormatters.js.
 */

// ── Auth ──────────────────────────────────────────────────────
export const register = (payload) => http.post("/auth/register", payload, { auth: false });
export const login = (payload) => http.post("/auth/login", payload, { auth: false });
export const getMe = () => http.get("/auth/me");

/**
 * Pede o link de redefinição de senha.
 *
 * Responde 200 com a MESMA mensagem exista a conta ou não — a rota é
 * deliberadamente cega para não virar consulta de quem tem cadastro aqui (ver
 * backend/src/controllers/authController.js). Logo, a resposta NÃO confirma que
 * o e-mail existe, e a tela não pode sugerir que confirma.
 *
 * @param {{ email: string }} payload
 */
export const forgotPassword = (payload) =>
	http.post("/auth/forgot-password", payload, { auth: false });

/**
 * Troca a senha usando o token que chegou por e-mail.
 *
 * Não devolve sessão de propósito: quem abriu o link pode não ser o dono da
 * conta (link encaminhado, navegador compartilhado), então o login com a senha
 * nova é que prova quem é. Token inválido, expirado ou já usado vira 400 com a
 * mesma mensagem, que chega no `displayMessage` do ApiError.
 *
 * @param {{ token: string, password: string }} payload
 */
export const resetPassword = (payload) =>
	http.post("/auth/reset-password", payload, { auth: false });

// ── Conta (LGPD) ──────────────────────────────────────────────
/**
 * Baixa tudo o que a conta guarda, em um arquivo JSON.
 *
 * Devolve `{ blob, filename }`, e NÃO o JSON decodificado como as outras
 * funções daqui: a resposta é um arquivo para o disco do usuário, não dado para
 * a tela. Decodificar seria desperdício — o conteúdo nunca é lido pelo app — e
 * `JSON.parse` de uma exportação grande travaria a aba. Ver `responseType` em
 * services/http.js: o token, o 401 e o ApiError seguem o mesmo caminho das
 * demais chamadas.
 *
 * `filename` vem do `Content-Disposition` e pode chegar VAZIO entre origens
 * diferentes (ver filenameFromDisposition); quem chama precisa ter um nome de
 * reserva.
 *
 * A resposta é streaming e não tem `Content-Length`: não há como calcular
 * porcentagem de progresso, só estado indeterminado.
 *
 * Limite de 5 chamadas por hora; a sexta responde 429.
 */
export const exportAccount = () => http.get("/account/export", { responseType: "blob" });

/**
 * Apaga a conta e tudo que pertence a ela. Irreversível.
 *
 * Exige a senha atual no corpo. Senha errada responde 401 e NADA é apagado —
 * por isso `logoutOn401: false`: aqui 401 significa "senha errada", não "sessão
 * expirada", e o handler global derrubaria a sessão, trocando a mensagem de
 * erro por um logout silencioso no meio do formulário.
 *
 * No sucesso o token morre no servidor. Quem chama é obrigado a descartar a
 * sessão local (`useAuth().logout()`), senão o token morto fica no localStorage
 * e a próxima tela quebra com 401.
 *
 * Limite de 3 chamadas por hora; a quarta responde 429.
 *
 * @param {{ password: string }} payload
 */
export const deleteAccount = ({ password }) =>
	http.delete("/account", { body: { password }, logoutOn401: false });

// ── Dashboard ─────────────────────────────────────────────────
export const getMonthlyBalance = (year, month) =>
	http.get("/dashboard/monthly-balance", { params: { year, month } });

export const getTotalSavedMoney = () => http.get("/dashboard/saved-money-total");

export const getCategoryBreakdown = (year, month) =>
	http.get("/dashboard/category-breakdown", { params: { year, month } });

/**
 * Quanto já está comprometido nos próximos meses.
 *
 * Sem year/month: a série começa SEMPRE no mês corrente, porque "o que ainda
 * vai sair" só faz sentido para a frente. `months` é inteiro de 1 a 24 (fora
 * disso o backend responde 400) e o padrão é 6.
 *
 * A resposta é um ARRAY puro — não `{ projection: [...] }` — em ordem
 * cronológica e com exatamente `months` itens: mês sem compromisso vem zerado,
 * nunca ausente. Em cada item, `committedInCents` é a soma de
 * `invoicesInCents` com `debitsInCents`, e `cards` é só a abertura das faturas
 * (o débito não tem cartão e vive inteiro em `debitsInCents`).
 *
 * @param {{ months?: number }} [options]
 */
export const getProjection = ({ months = 6 } = {}) =>
	http.get("/dashboard/projection", { params: { months } });

// ── Transactions ──────────────────────────────────────────────
export const getTransactions = (params = {}) => http.get("/transactions", { params });

export const createTransaction = (transaction) => http.post("/transactions", transaction);

export const updateTransaction = (id, transaction) =>
	http.patch(`/transactions/${id}`, transaction);

/**
 * @param {string} id
 * @param {"single"|"group"} scope - "group" apaga todas as parcelas da compra.
 *   O padrão é "single", o comportamento menos destrutivo (ver bug C3).
 */
export const deleteTransaction = (id, scope = "single") =>
	http.delete(`/transactions/${id}`, { params: { scope } });

// ── Goals ─────────────────────────────────────────────────────
export const getGoals = () => http.get("/goals");
export const createGoal = (goal) => http.post("/goals", goal);
export const updateGoal = (id, goal) => http.patch(`/goals/${id}`, goal);
export const deleteGoal = (id) => http.delete(`/goals/${id}`);

// ── Bank Cards ────────────────────────────────────────────────
export const getBankCards = () => http.get("/bank-cards");
export const createBankCard = (card) => http.post("/bank-cards", card);
export const updateBankCard = (id, card) => http.patch(`/bank-cards/${id}`, card);
export const deleteBankCard = (id) => http.delete(`/bank-cards/${id}`);

// ── Faturas ───────────────────────────────────────────────────
/** Faturas recentes de um cartão, da mais nova para a mais antiga. */
/**
 * Faturas recentes de um cartão.
 *
 * year/month ancoram a lista: vem primeiro a fatura que recebe as compras
 * daquele mês — num cartão que fecha dia 01, as de setembro estão na fatura de
 * outubro —, seguida das anteriores. Sem eles, a âncora é o mês corrente.
 */
export const getCardInvoices = (cardId, { limit = 6, year, month } = {}) =>
	http.get(`/bank-cards/${cardId}/invoices`, { params: { limit, year, month } });

/** @param {string} cycle - Ciclo no formato "2026-08" (ano-mês do vencimento). */
export const getCardInvoice = (cardId, cycle) =>
	http.get(`/bank-cards/${cardId}/invoices/${cycle}`);

// ── Categories ────────────────────────────────────────────────
export const getCategories = () => http.get("/categories");
export const createCategory = (category) => http.post("/categories", category);
export const deleteCategory = (id) => http.delete(`/categories/${id}`);
