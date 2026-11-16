# gestaoApp · Gráficos

Data-visualization layer of the gestaoApp design system: tokens, 21 React chart components, a responsive report template and guidelines. Self-contained — copy the whole `graficos/` folder into any project.

## Como usar
```html
<link rel="stylesheet" href="graficos/graficos.css">
<!-- React 18, ReactDOM, @babel/standalone -->
<script src="graficos/loader.js"></script>          <!-- window.Graficos -->
<script type="text/babel">
  const { ChartCard, LineChart } = window.Graficos;
  <ChartCard title="Tarefas concluídas" value={186} delta={12.4} comparison="vs 30 dias anteriores">
    <LineChart data={rows} series={[{ key: 'done', label: 'Concluídas', area: true }]} highlightLast />
  </ChartCard>
</script>
```
Inside the gestaoApp design system the same components are in the compiled bundle (`window.GestaoAppDesignSystem_8ff7d0`), and `styles.css` already imports `graficos/graficos.css`. In React code: `import { LineChart } from './graficos/components/cartesian/LineChart.jsx'`.

Fonts: Outfit (`--chart-font`). Without the root design system, load Outfit from Google Fonts or the DS `assets/fonts/`.

## Componentes
| Pasta | Componentes | Para quê |
|---|---|---|
| base | ChartCard, ChartLegend, TrendDelta (+ helpers em ChartCore) | Moldura, legenda interativa, variação, estados carregando/vazio/erro |
| cartesian | LineChart, AreaChart, ColumnChart, ComboChart, ScatterChart, WaterfallChart | Tendência, comparação por período, volume × taxa, correlação, cascata |
| proportion | DonutChart, HBarChart, DistributionBar, FunnelChart, Treemap | Composição, ranking, etapas |
| progress | MetricCard, Sparkline, GaugeChart, RadialProgress, BulletChart | KPIs, metas, real × planejado |
| specialized | Heatmap, RadarChart, GanttChart | Padrões dia × hora, perfil, cronograma |

Each component has `.d.ts` (props) and `.prompt.md` (when to use + example).

## Qual gráfico usar
- **Tendência no tempo** → LineChart (≤4 linhas; período anterior tracejado) · AreaChart (volume; `stacked` para composição no tempo) · Sparkline (dentro de KPIs/tabelas).
- **Comparar categorias** → HBarChart quando os rótulos são nomes (pessoas, projetos) · ColumnChart para períodos (≤12 colunas).
- **Parte de um todo** → DonutChart (2–6 fatias) · DistributionBar (compacto/mobile) · Treemap (7–20 itens).
- **Real × meta** → BulletChart (várias linhas) · GaugeChart (um índice) · RadialProgress (metas pessoais, até 3 anéis).
- **Etapas** → FunnelChart. **Variação entre dois totais** → WaterfallChart. **Volume + taxa** → ComboChart.
- **Relação entre medidas** → ScatterChart (bolhas + quadrantes). **Dia × hora / calendário** → Heatmap. **Perfil** → RadarChart (máx. 2 séries). **Cronograma** → GanttChart.

## Cor
- Categórica em ordem fixa `--chart-1…8`: cobalto, laranja, violeta, lima, magenta, céu, verde, grafite. Texto sobre cada cor: `--chart-on-N`.
- Sequencial cobalto `--chart-seq-0…7` (intensidade, funil, mapa de calor). Divergente `--chart-div-*` (abaixo ↔ acima do plano).
- Significado: `--chart-positive` melhora · `--chart-negative` piora · `--chart-warning` · `--chart-highlight` (zest) só para o período atual/hoje · `--chart-target` meta (traço tinta) · `--chart-comparison` período anterior (tracejado cinza) · `--chart-forecast`.
- Status e prioridade têm tokens próprios (`--chart-status-*`, `--chart-priority-*`) — use-os sempre que o dado for status/prioridade.
- Verde/vermelho indicam **bom/ruim**, não direção: use `invert` quando menor é melhor (tempo de ciclo, atrasos, custo, horas acima do planejado).
- Tema escuro: `[data-theme="dark"]` troca superfície, grade, tooltip e a escala sequencial.

## Anatomia e texto
1. Título = a pergunta, em sentence case ("Concluídas por semana"); subtítulo = período · escopo.
2. Número principal + TrendDelta + comparação explícita ("vs 30 dias anteriores").
3. Legenda acima do gráfico, clicável (oculta séries sem removê-las da legenda).
4. Gráfico: grade horizontal leve, sem grade vertical, eixo Y começa em 0 para contagens, rótulos do eixo em 11 px `--chart-axis-text`.
5. Rodapé: "Fonte: … · Atualizado há 5 min".

## Números e datas (pt-BR)
`formatValue(v, f)`: `number` 1.284 · `compact` 12,4 mil · `percent` 87,5% · `pp` +3,1 pp · `currency` R$ 12.300 · `currencyCompact` R$ 12,3 mil · `hours` 182 h · `days` 2,4 dias. Datas curtas "8 out", dias "seg", meses "out"; hora 24 h. Sinal de menos tipográfico (−).

## Layout de relatório
- `.gx-dash-wrap > .gx-dash` grade de 12 colunas com `.gx-span-3/4/5/6/7/8/12`. Usa container queries: 12 → 6 colunas abaixo de 1100 px de largura do container, tudo em 1 coluna abaixo de 760 px; KPIs 4 → 2 → 1.
- Ordem: KPIs → tendência principal (8) + composição (4) → detalhamentos → tabelas/cronogramas (12).
- Filtros de período (7 dias · 30 dias · Trimestre · 12 meses) e Exportar no cabeçalho da página; no celular, período em largura total abaixo do título.

## Interação, estados e acessibilidade
- Tooltip escuro segue ponteiro/dedo (pointer events); linha usa crosshair, colunas usam faixa de hover e esmaecem as demais.
- `ChartCard state="loading" | "empty" | "error"` com a mesma `height` do gráfico (sem pulo de layout).
- Cada SVG tem `role="img"` + `aria-label`; gráficos cartesianos incluem tabela oculta com os dados. Cor nunca é o único canal (rótulos, valores, tracejado).
- Animação: barras crescem e linhas desenham em 700 ms (`--chart-dur`, `--chart-ease`); desligado com `prefers-reduced-motion`.

## Faça / evite
Faça: começar contagens em 0 · no máx. 4 linhas / 6 fatias (agrupe em "Outros") · rótulos diretos · zest só no atual · estados com a mesma altura.
Evite: 3D, sombras e gradientes decorativos · arco-íris · eixo truncado para exagerar · legenda distante · dois eixos sem cor de identificação.
