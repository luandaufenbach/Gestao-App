/* gestaoApp · Gráficos — standalone loader.
   Use when the compiled design-system bundle is not available (e.g. after copying only this folder).
   Requires React 18, ReactDOM and @babel/standalone loaded BEFORE this script; serve over http(s).
   Exposes every component on window.Graficos. */
(function () {
  var me = document.currentScript;
  var base = (me && me.src ? me.src : location.href).replace(/[^/]*$/, '');
  var files = ['base/ChartCore', 'base/TrendDelta', 'base/ChartLegend', 'base/ChartCard',
    'cartesian/LineChart', 'cartesian/AreaChart', 'cartesian/ColumnChart', 'cartesian/ComboChart', 'cartesian/ScatterChart', 'cartesian/WaterfallChart',
    'proportion/DonutChart', 'proportion/HBarChart', 'proportion/DistributionBar', 'proportion/FunnelChart', 'proportion/Treemap',
    'progress/Sparkline', 'progress/MetricCard', 'progress/GaugeChart', 'progress/RadialProgress', 'progress/BulletChart',
    'specialized/Heatmap', 'specialized/RadarChart', 'specialized/GanttChart'];
  var NS = window.Graficos = window.Graficos || {};
  if (!window.React || !window.Babel) { console.error('graficos/loader.js: carregue React 18, ReactDOM e @babel/standalone antes deste script.'); return; }
  files.forEach(function (f) {
    var x = new XMLHttpRequest();
    x.open('GET', base + 'components/' + f + '.jsx', false);
    try { x.send(); } catch (e) { console.error('graficos: falha ao carregar ' + f, e); return; }
    if (x.status >= 400) { console.error('graficos: falha ao carregar ' + f + ' (' + x.status + ')'); return; }
    var src = x.responseText, names = [], exps = [];
    src = src.replace(/^import\s+React[^\n]*$/mg, '').replace(/^import\s*\{([^}]+)\}[^\n]*$/mg, function (_, n) {
      names = names.concat(n.split(',').map(function (s) { return s.trim(); }).filter(Boolean)); return '';
    });
    src = src.replace(/^export\s+(function|const)\s+(\w+)/mg, function (_, k, n) { exps.push(n); return k + ' ' + n; });
    var head = names.length ? 'var ' + names.map(function (n) { return n + '=NS.' + n; }).join(',') + ';' : '';
    var code = Babel.transform('(function(){' + head + src + '\n' + exps.map(function (n) { return 'NS.' + n + '=' + n + ';'; }).join('') + '})();', { presets: ['react'] }).code;
    new Function('NS', 'React', code)(NS, window.React);
  });
})();
