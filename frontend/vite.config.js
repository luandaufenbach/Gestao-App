import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
	plugins: [
		vue(),
		/**
		 * PWA instalável (ROADMAP 4.1).
		 *
		 * O plugin existe por causa de UM problema chato: o service worker
		 * precisa listar os arquivos do build para guardá-los, e esses nomes
		 * levam hash que muda a cada build. Escrever isso à mão dá uma lista
		 * desatualizada no primeiro deploy.
		 *
		 * NENHUMA RESPOSTA DA API É GUARDADA, e isso é deliberado: só o que o
		 * build gera entra no cache. Num app de dinheiro, mostrar saldo velho
		 * sem avisar é pior que mostrar erro de conexão. Se um dia alguém quiser
		 * leitura offline, isso é recurso com tela própria — "dados de
		 * <data>" —, não um cache silencioso ligado aqui.
		 */
		VitePWA({
			/**
			 * `autoUpdate`: a versão nova entra sozinha na próxima abertura, sem
			 * perguntar. O oposto (`prompt`) deixaria alguém rodando código
			 * antigo contra a API nova por tempo indefinido.
			 */
			registerType: "autoUpdate",

			/**
			 * Registra o worker também no dev server, senão a única forma de
			 * conferir instalabilidade seria publicando.
			 *
			 * No dev o worker é servido em `/dev-sw.js`, e `/sw.js` cai no
			 * `navigateFallback` e devolve index.html. Nada pede `/sw.js` ali,
			 * então não quebra nada — mas quem for depurar à mão vai achar
			 * estranho receber HTML, e é só isso.
			 */
			devOptions: { enabled: true, type: "module" },

			includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],

			manifest: {
				name: "Gestão Financeira",
				// Até 12 caracteres: é o que cabe embaixo do ícone na tela inicial.
				short_name: "Gestão",
				description:
					"Controle de gastos, faturas de cartão e metas de reserva, com saldo mensal e histórico por categoria.",
				lang: "pt-BR",
				/**
				 * `standalone` é o que atende o aceite do 4.1: abre sem a barra do
				 * navegador. `start_url` vai para a raiz, e o router decide entre
				 * login e dashboard conforme a sessão.
				 */
				display: "standalone",
				start_url: "/",
				scope: "/",
				orientation: "portrait",
				/** Cloud e Cobalt do design system, não mais o slate do visual antigo. */
				background_color: "#FAFBFD",
				theme_color: "#FAFBFD",
				icons: [
					{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
					{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
					/**
					 * O maskable é obrigatório no Android: sem ele o sistema põe o
					 * ícone inteiro dentro de um quadrado branco, com moldura. Este
					 * sangra a cor até a borda e mantém a letra na zona segura.
					 */
					{
						src: "/icons/icon-maskable-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
			},

			workbox: {
				// As fontes entram no precache: sem elas a primeira abertura
				// offline desenharia o app inteiro na fonte de sistema.
				globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
				/**
				 * Toda navegação cai no index.html guardado, que é o que faz o app
				 * abrir offline. `navigateFallbackDenylist` protege o que não é
				 * tela: sem isso, um GET para a API na mesma origem receberia HTML.
				 */
				navigateFallback: "index.html",
				navigateFallbackDenylist: [/^\/api\//],
				cleanupOutdatedCaches: true,
			},
		}),
	],
	resolve: {
		alias: {
			/**
			 * `__dirname` não existe em módulos ESM, e este arquivo é ESM
			 * (package.json declara "type": "module"). Funcionava apenas porque o
			 * Vite transpila a config para CommonJS antes de executá-la — algo em
			 * que não se deve confiar. `import.meta.url` é a forma correta.
			 */
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	server: {
		port: 5173,
	},
});
