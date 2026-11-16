---
name: gestaoapp-graficos
description: Use this skill to build charts, dashboards and reports for gestaoApp — line, area, column (grouped/stacked), combo, scatter/bubble, waterfall, donut/pie, horizontal bar ranking, distribution bar, funnel, treemap, sparkline, KPI metric cards, gauge, radial progress, bullet, heatmap, radar and Gantt — with the brand's data-viz palette, pt-BR number formatting, responsive behavior and accessibility rules.
user-invocable: true
---

Read README.md in this folder first — it is the data-viz guideline (which chart for which question, color rules, formatting, layout, states, do/don't).

Files:
- `graficos.css` — link this one file (imports `tokens.css` + `charts.css`). All classes are prefixed `gx-`; all tokens `--chart-*`.
- `components/**` — React source (`.jsx`), props contracts (`.d.ts`) and usage notes (`.prompt.md`) for every chart.
- `loader.js` — runs the components in a plain HTML page without a build step (React 18 + ReactDOM + @babel/standalone first; exposes `window.Graficos`).
- `exemplos/relatorio.html` + `relatorio-conteudo.jsx` + `dados.js` — a complete responsive report page (Visão geral / Projetos / Equipe) to copy from.
- `fundamentos/*.html` — palette, semantics, anatomy, chart chooser, formatting, best practices.

When building visual artifacts (mocks, prototypes, reports), copy this folder next to your HTML, link `graficos.css`, load `loader.js` and compose `ChartCard` + a chart. In production React code, import the `.jsx` files directly — they only depend on React.

If the user invokes this skill without guidance, ask what question the report must answer, who reads it, which period/filters it needs and whether it must work on mobile; then propose the charts using the chooser in README.md.
