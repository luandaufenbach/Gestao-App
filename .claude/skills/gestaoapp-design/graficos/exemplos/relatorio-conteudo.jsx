/* gestaoApp · Gráficos — conteúdo do relatório (compartilhado entre exemplos/relatorio.html e o UI kit admin).
   Requer window.GX_DEMO (dados.js) e os componentes (bundle do design system ou graficos/loader.js). */
const RELATORIO_PERIODOS = [{ value: '7d', label: '7 dias' }, { value: '30d', label: '30 dias' }, { value: '90d', label: 'Trimestre' }, { value: '12m', label: '12 meses' }];
const RELATORIO_ABAS = [{ value: 'geral', label: 'Visão geral' }, { value: 'projetos', label: 'Projetos' }, { value: 'equipe', label: 'Equipe' }];
const PERIODO_TXT = { '7d': 'Últimos 7 dias', '30d': 'Últimos 30 dias', '90d': 'Últimas 13 semanas', '12m': 'Últimos 12 meses' };

function relG() { const NS = window.GestaoAppDesignSystem_8ff7d0; return NS && NS.ChartCard ? NS : window.Graficos; }
function useToggle() {
  const [hidden, setHidden] = React.useState([]);
  return [hidden, function (k) { setHidden(function (h) { return h.indexOf(k) >= 0 ? h.filter(function (x) { return x !== k; }) : h.concat([k]); }); }];
}
function Ini({ name, color }) { return <span className="gx-ini" style={{ '--c': color }}>{name.split(' ').map(function (x) { return x[0]; }).join('').slice(0, 2)}</span>; }
const fonte = function (s) { return <React.Fragment><span>{'Fonte: ' + s}</span><span>Atualizado há 5 min</span></React.Fragment>; };

function RelatorioGeral({ period }) {
  const G = relG(), X = window.GX_DEMO;
  const p = X.period(period);
  const [hidden, toggle] = useToggle();
  const delta = Math.round((p.done / p.prev - 1) * 1000) / 10;
  const cmp = 'vs período anterior';
  return (
    <div className="gx-dash">
      <G.MetricCard className="gx-span-3" label="Tarefas concluídas" value={p.done} delta={delta} spark={p.rows.map(function (r) { return r.done; })} comparison={cmp} />
      <G.MetricCard className="gx-span-3" variant="brand" label="Taxa de conclusão" value={Math.round((p.done / p.created) * 100) + '%'} delta={3.1} deltaFormat="pp" spark={X.spark.rate} sparkVariant="line" comparison={cmp} />
      <G.MetricCard className="gx-span-3" label="Tempo médio de ciclo" value="2,4" unit="dias" delta={-8} invert spark={X.spark.cycle} sparkVariant="line" sparkColor="var(--chart-positive)" comparison={cmp} />
      <G.MetricCard className="gx-span-3" label="Tarefas atrasadas" value={7} delta={2} deltaFormat="number" invert spark={X.spark.late} sparkVariant="bar" sparkColor="var(--chart-negative)" comparison={cmp} />
      <G.ChartCard className="gx-span-8" title="Tarefas criadas × concluídas" subtitle={PERIODO_TXT[period] + ' · todos os projetos'} value={p.done} delta={delta} comparison="concluídas vs período anterior"
        legend={[{ key: 'done', label: 'Concluídas', color: 'var(--chart-1)' }, { key: 'created', label: 'Criadas', color: 'var(--chart-2)', shape: 'line' }, { key: 'prev', label: 'Período anterior', color: 'var(--chart-comparison)', dashed: true }]}
        hidden={hidden} onToggleLegend={toggle} footer={fonte('tarefas')}>
        <G.LineChart height={240} data={p.rows} hidden={hidden} highlightLast ariaLabel="Tarefas criadas e concluídas por período"
          series={[{ key: 'done', label: 'Concluídas', area: true }, { key: 'created', label: 'Criadas' }, { key: 'prev', label: 'Período anterior', color: 'var(--chart-comparison)', dashed: true }]} />
      </G.ChartCard>
      <G.ChartCard className="gx-span-4" title="Tarefas por status" subtitle="Situação atual" footer={fonte('tarefas')}>
        <G.DonutChart data={X.status} size={168} thickness={20} centerLabel="tarefas" legend="bottom" />
      </G.ChartCard>
      <G.ChartCard className="gx-span-7" title="Concluídas por prioridade" subtitle="Por semana" legend={[{ label: 'Alta', color: 'var(--chart-priority-high)' }, { label: 'Média', color: 'var(--chart-priority-medium)' }, { label: 'Baixa', color: 'var(--chart-priority-low)' }]}>
        <G.ColumnChart mode="stacked" height={230} data={X.priorityWeeks} showValues series={[{ key: 'high', label: 'Alta', color: 'var(--chart-priority-high)' }, { key: 'medium', label: 'Média', color: 'var(--chart-priority-medium)' }, { key: 'low', label: 'Baixa', color: 'var(--chart-priority-low)' }]} />
      </G.ChartCard>
      <G.ChartCard className="gx-span-5" title="Fluxo de tarefas" subtitle="Quantas avançam em cada etapa">
        <G.FunnelChart steps={X.funnel} labelWidth={112} />
      </G.ChartCard>
      <G.ChartCard className="gx-span-6" title="Entregas × % no prazo" subtitle="Por mês" legend={[{ label: 'Entregas', color: 'var(--chart-seq-3)' }, { label: '% no prazo', color: 'var(--chart-1)', shape: 'line' }]}>
        <G.ComboChart height={220} data={X.combo} bar={{ key: 'delivered', label: 'Entregas' }} line={{ key: 'onTime', label: '% no prazo' }} y2Domain={[60, 100]} highlight={X.combo.length - 1} />
      </G.ChartCard>
      <G.ChartCard className="gx-span-6" title="Concluídas por semana" subtitle="Semana atual em destaque" value={X.weeks[X.weeks.length - 2].value} delta={13.3} comparison="última semana fechada">
        <G.ColumnChart height={176} data={X.weeks} series={[{ key: 'value', label: 'Concluídas' }]} highlight={X.weeks.length - 1} showValues />
      </G.ChartCard>
    </div>
  );
}

function RelatorioProjetos() {
  const G = relG(), X = window.GX_DEMO;
  return (
    <div className="gx-dash">
      <G.ChartCard className="gx-span-12" flush title="Cronograma dos projetos" subtitle="Progresso, marcos e hoje" footer={fonte('projetos')}>
        <G.GanttChart start="2026-09-14" end="2026-11-15" today="2026-10-08" rows={X.projectsGantt} labelWidth={190} />
      </G.ChartCard>
      <G.ChartCard className="gx-span-7" title="Horas planejadas × realizadas" subtitle="Traço = planejado · vermelho = acima do planejado">
        <G.BulletChart rows={X.bullet} format="hours" overIsBad />
      </G.ChartCard>
      <G.ChartCard className="gx-span-5" title="Horas por projeto" subtitle={'Total: 573 h'}>
        <G.Treemap height={236} format="hours" data={X.hoursByProject} />
      </G.ChartCard>
      <G.ChartCard className="gx-span-4" title="Saúde da sprint" subtitle="Sprint 14 · termina em 6 dias">
        <G.GaugeChart value={78} target={85} label="de 100" format="number" size={210} zones={[{ to: 60, color: 'var(--chart-negative)' }, { to: 80, color: 'var(--chart-warning)' }, { to: 100, color: 'var(--chart-positive)' }]} />
        <div className="gx-facts" style={{ marginTop: 14 }}><div className="gx-fact"><b>31</b><span>pontos restantes</span></div><div className="gx-fact"><b>2</b><span>bloqueios</span></div><div className="gx-fact"><b>92%</b><span>foco</span></div></div>
      </G.ChartCard>
      <G.ChartCard className="gx-span-8" title="Burndown da sprint" subtitle="Pontos restantes por dia útil" legend={[{ label: 'Real', color: 'var(--chart-1)', shape: 'line' }, { label: 'Ideal', color: 'var(--chart-comparison)', dashed: true }]}>
        <G.LineChart height={250} curve="linear" data={X.burndown} highlightLast series={[{ key: 'real', label: 'Real', area: true }, { key: 'ideal', label: 'Ideal', color: 'var(--chart-comparison)', dashed: true }]} />
      </G.ChartCard>
      <G.ChartCard className="gx-span-6" title="Horas: planejado → realizado" subtitle="O que mudou no mês">
        <G.WaterfallChart height={250} steps={X.waterfall} yFormat="hours" invert />
      </G.ChartCard>
      <G.ChartCard className="gx-span-6" title="Esforço × impacto" subtitle="Bolha = nº de tarefas" legend={X.scatterGroups.map(function (g) { return { label: g.label, color: g.color || 'var(--chart-1)', shape: 'dot' }; })}>
        <G.ScatterChart bubble height={250} points={X.scatter} groups={X.scatterGroups} xFormat="hours" xLabel="Esforço (h)" yLabel="Impacto" quadrants={{ x: 80, y: 5.5, labels: ['Ganhos rápidos', 'Grandes apostas', '', 'Reavaliar'] }} />
      </G.ChartCard>
    </div>
  );
}

function RelatorioEquipe() {
  const G = relG(), X = window.GX_DEMO;
  return (
    <div className="gx-dash">
      <G.ChartCard className="gx-span-5" title="Tarefas concluídas por membro" subtitle="Últimos 30 dias · meta 30">
        <G.HBarChart showRank target={30} labelWidth={170} data={X.members.map(function (m) { return Object.assign({}, m, { prefix: <Ini name={m.label} color={m.tone} /> }); })} />
      </G.ChartCard>
      <G.ChartCard className="gx-span-7" title="Quando a equipe conclui tarefas" subtitle="Dia da semana × hora">
        <G.Heatmap rows={X.heatRows} cols={X.heatCols} values={X.heat} />
      </G.ChartCard>
      <G.ChartCard className="gx-span-6" title="Perfil de carga" subtitle="Horas por tipo · sprint atual × anterior" legend={[{ label: 'Sprint atual', color: 'var(--chart-1)' }, { label: 'Sprint anterior', color: 'var(--chart-comparison)', dashed: true }]}>
        <G.RadarChart axes={X.radarAxes} series={X.radar} height={270} format="hours" />
      </G.ChartCard>
      <G.ChartCard className="gx-span-6" title="Metas da semana" subtitle="Equipe inteira">
        <G.RadialProgress rings={X.rings} size={150} thickness={12} />
        <div style={{ height: 8 }} />
        <G.DistributionBar format="hours" data={X.types} />
      </G.ChartCard>
      <G.ChartCard className="gx-span-12" title="Calendário de entregas" subtitle="Tarefas concluídas por dia · últimas 20 semanas">
        <G.Heatmap rows={X.calRows} cols={X.calCols} values={X.calendar} maxCell={30} colLabelEvery={2} />
      </G.ChartCard>
    </div>
  );
}

function RelatorioConteudo({ tab = 'geral', period = '30d' }) {
  return (
    <div className="gx-dash-wrap">
      {tab === 'projetos' ? <RelatorioProjetos /> : tab === 'equipe' ? <RelatorioEquipe /> : <RelatorioGeral period={period} />}
    </div>
  );
}

Object.assign(window, { RelatorioConteudo, RELATORIO_PERIODOS, RELATORIO_ABAS, PERIODO_TXT });
