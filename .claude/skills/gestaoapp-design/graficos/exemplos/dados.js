/* gestaoApp · Gráficos — dados de exemplo (pt-BR). Hoje = qua, 8 out 2026. */
window.GX_DEMO = (function () {
  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  var MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var DIA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var END = Date.UTC(2026, 9, 8), D = 86400000;
  var CFG = { '7d': { n: 7, unit: 1, scale: 1 }, '30d': { n: 30, unit: 1, scale: 1 }, '90d': { n: 13, unit: 7, scale: 6 }, '12m': { n: 12, unit: 30, scale: 24 } };
  function period(p) {
    var c = CFG[p] || CFG['30d'], r = rng(c.n * 31 + 7), rows = [];
    for (var i = 0; i < c.n; i++) {
      var t = END - (c.n - 1 - i) * c.unit * D, d = new Date(t), label;
      if (p === '7d') label = DIA[d.getUTCDay()];
      else if (p === '12m') label = MES[(9 - (c.n - 1 - i) + 24) % 12];
      else label = d.getUTCDate() + ' ' + MES[d.getUTCMonth()];
      var wk = c.unit === 1 && (d.getUTCDay() === 0 || d.getUTCDay() === 6) ? 0.5 : 1;
      var trend = 1 + (i / c.n) * 0.3;
      var done = Math.round((5 + r() * 4) * trend * c.scale * wk);
      var created = Math.round(done * (0.9 + r() * 0.35) + (r() * 2 * c.scale * wk));
      var prev = Math.round(done * (0.78 + r() * 0.2));
      rows.push({ label: label, done: done, created: created, prev: prev });
    }
    var sum = function (k) { return rows.reduce(function (a, x) { return a + x[k]; }, 0); };
    return { rows: rows, done: sum('done'), created: sum('created'), prev: sum('prev') };
  }
  var members = [
    { label: 'Marina Alves', sub: 'Design', value: 38, tone: 'var(--chart-1)' },
    { label: 'João Kim', sub: 'Conteúdo', value: 31, tone: 'var(--chart-4)' },
    { label: 'Rosa Silva', sub: 'Design', value: 29, tone: 'var(--chart-3)' },
    { label: 'Léo Prado', sub: 'Desenvolvimento', value: 24, tone: 'var(--chart-2)' },
    { label: 'Ana Navarro', sub: 'Gestão', value: 21, tone: 'var(--chart-8)' },
    { label: 'Tom Reis', sub: 'Freelancer', value: 9, tone: 'var(--chart-6)' }
  ];
  var heatCols = ['8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h'];
  var heatRows = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
  var hr = rng(99);
  var heat = heatRows.map(function (d, i) { return heatCols.map(function (h, j) { var w = i > 4 ? 0.12 : 1; var peak = Math.exp(-Math.pow(j - 2.5, 2) / 6) + 0.8 * Math.exp(-Math.pow(j - 7, 2) / 5); return Math.round((peak * 9 + hr() * 3) * w * (j === 4 ? 0.45 : 1)); }); });
  var cal = rng(5);
  var calCols = []; for (var w = 0; w < 20; w++) { var td = new Date(END - (19 - w) * 7 * D); calCols.push(td.getUTCDate() + ' ' + MES[td.getUTCMonth()]); }
  var calendar = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map(function (d, i) { return calCols.map(function (_, j) { if (j === 19 && i > 2) return null; var v = cal(); return i > 4 ? (v > 0.8 ? 1 : 0) : Math.round(v * v * 9 + j * 0.15); }); });
  return {
    period: period,
    status: [
      { label: 'A fazer', value: 42, color: 'var(--chart-status-todo)' },
      { label: 'Em andamento', value: 31, color: 'var(--chart-status-progress)' },
      { label: 'Em revisão', value: 14, color: 'var(--chart-status-review)' },
      { label: 'Concluída', value: 161, color: 'var(--chart-status-done)' }
    ],
    priorityWeeks: [
      { label: '1 set', high: 6, medium: 11, low: 9 }, { label: '8 set', high: 8, medium: 12, low: 7 }, { label: '15 set', high: 5, medium: 14, low: 10 },
      { label: '22 set', high: 9, medium: 13, low: 8 }, { label: '29 set', high: 7, medium: 16, low: 11 }, { label: '6 out', high: 4, medium: 9, low: 6 }
    ],
    weeks: [{ label: '1 set', value: 26 }, { label: '8 set', value: 27 }, { label: '15 set', value: 29 }, { label: '22 set', value: 30 }, { label: '29 set', value: 34 }, { label: '6 out', value: 19 }],
    members: members,
    projectsGantt: [
      { label: 'Redesign do site', start: '2026-09-21', end: '2026-10-24', progress: 72, color: 'var(--chart-1)' },
      { label: 'Vídeo da marca', start: '2026-09-28', end: '2026-10-18', progress: 45, color: 'var(--chart-2)' },
      { label: 'App mobile', start: '2026-10-05', end: '2026-11-15', progress: 38, color: 'var(--chart-3)' },
      { label: 'Marketing', start: '2026-09-14', end: '2026-10-10', progress: 61, color: 'var(--chart-5)' },
      { label: 'Lançamento', sub: 'Marco · 27 out', start: '2026-10-27', milestone: true, color: 'var(--chart-target)' }
    ],
    hoursByProject: [
      { label: 'Redesign do site', value: 182 }, { label: 'App mobile', value: 140 }, { label: 'Vídeo da marca', value: 96 },
      { label: 'Marketing', value: 74 }, { label: 'Onboarding', value: 38 }, { label: 'Interno', value: 26 }, { label: 'Suporte', value: 17 }
    ],
    bullet: [
      { label: 'Redesign do site', sub: 'Fase 2', value: 182, target: 200, ranges: [120, 180, 240] },
      { label: 'App mobile', sub: 'Onboarding', value: 140, target: 128, ranges: [80, 120, 160] },
      { label: 'Vídeo da marca', sub: 'Pós-produção', value: 96, target: 90, ranges: [60, 90, 120] },
      { label: 'Marketing', sub: 'Campanha', value: 74, target: 96, ranges: [60, 90, 120] }
    ],
    funnel: [{ label: 'Criadas', value: 248 }, { label: 'Iniciadas', value: 221 }, { label: 'Em revisão', value: 197 }, { label: 'Concluídas', value: 186 }],
    radarAxes: ['Design', 'Desenvolvimento', 'Conteúdo', 'Reuniões', 'Revisão', 'Gestão'],
    radar: [{ key: 'cur', label: 'Sprint atual', values: [42, 30, 18, 14, 22, 10] }, { key: 'prev', label: 'Sprint anterior', values: [36, 34, 12, 20, 16, 12], color: 'var(--chart-comparison)', dashed: true }],
    combo: [{ label: 'jun', delivered: 96, onTime: 81 }, { label: 'jul', delivered: 104, onTime: 84 }, { label: 'ago', delivered: 99, onTime: 79 }, { label: 'set', delivered: 121, onTime: 88 }, { label: 'out', delivered: 58, onTime: 91 }],
    scatterGroups: [{ key: 'web', label: 'Web' }, { key: 'mkt', label: 'Marketing', color: 'var(--chart-2)' }, { key: 'prod', label: 'Produto', color: 'var(--chart-3)' }],
    scatter: [
      { x: 40, y: 8.6, size: 25, label: 'Redesign do site', group: 'web' }, { x: 120, y: 7.4, size: 29, label: 'App mobile', group: 'prod' },
      { x: 30, y: 4.2, size: 12, label: 'Blog institucional', group: 'mkt' }, { x: 64, y: 6.1, size: 20, label: 'Vídeo da marca', group: 'mkt' },
      { x: 150, y: 3.2, size: 18, label: 'Migração do CRM', group: 'prod' }, { x: 18, y: 6.8, size: 8, label: 'Página de preços', group: 'web' },
      { x: 90, y: 9.1, size: 22, label: 'Onboarding guiado', group: 'prod' }, { x: 110, y: 2.4, size: 10, label: 'Newsletter', group: 'mkt' }
    ],
    waterfall: [{ label: 'Planejado', value: 320, total: true }, { label: 'Escopo novo', value: 46 }, { label: 'Retrabalho', value: 18 }, { label: 'Automação', value: -24 }, { label: 'Férias', value: -12 }, { label: 'Realizado', total: true }],
    types: [{ label: 'Design', value: 128 }, { label: 'Desenvolvimento', value: 96 }, { label: 'Conteúdo', value: 54 }, { label: 'Reuniões', value: 31 }, { label: 'Revisão', value: 22 }],
    burndown: [
      { label: 'S1', ideal: 64, real: 64 }, { label: 'S2', ideal: 57, real: 60 }, { label: 'S3', ideal: 50, real: 55 }, { label: 'S4', ideal: 43, real: 47 },
      { label: 'S5', ideal: 36, real: 37 }, { label: 'S6', ideal: 29, real: 31 }, { label: 'S7', ideal: 21, real: null }, { label: 'S8', ideal: 14, real: null }, { label: 'S9', ideal: 7, real: null }, { label: 'S10', ideal: 0, real: null }
    ],
    rings: [{ label: 'Tarefas', value: 24, max: 28, sub: '24 de 28' }, { label: 'Horas focadas', value: 26, max: 32, sub: '26 h de 32 h' }, { label: 'Revisões', value: 9, max: 10, sub: '9 de 10' }],
    spark: { done: [18, 22, 19, 25, 24, 28, 31, 29, 34], rate: [81, 83, 82, 84, 85, 84, 86, 87, 87], cycle: [3.2, 3.1, 2.9, 3, 2.8, 2.7, 2.6, 2.5, 2.4], late: [4, 5, 3, 6, 5, 4, 6, 7, 7] },
    heatRows: heatRows, heatCols: heatCols, heat: heat, calRows: ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'], calCols: calCols, calendar: calendar
  };
})();
