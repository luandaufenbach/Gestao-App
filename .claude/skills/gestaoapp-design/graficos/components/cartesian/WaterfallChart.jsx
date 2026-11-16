import React from 'react';
import { useMeasure, niceTicks, formatValue, barPath, textWidth, tickStep, tickCount, bandIndex, ChartTooltip, WrapLabel } from '../base/ChartCore.jsx';

export function WaterfallChart({ steps = [], height = 260, yFormat, invert = false, showValues = true, ariaLabel, className, style }) {
  const [ref, width] = useMeasure();
  const [hover, setHover] = React.useState(null);
  let run = 0;
  const cols = steps.map(function (s) {
    if (s.total) { const c = { s: s, a: 0, b: s.value != null ? s.value : run, total: true }; run = c.b; return c; }
    const a = run; run += s.value; return { s: s, a: a, b: run, total: false };
  });
  let lo = 0, hi = 0; cols.forEach(function (c) { lo = Math.min(lo, c.a, c.b); hi = Math.max(hi, c.a, c.b); });
  const ticks = niceTicks(lo, hi || 1, tickCount(height));
  const yMin = ticks[0], yMax = ticks[ticks.length - 1];
  const lw = Math.max.apply(null, ticks.map(function (t) { return textWidth(formatValue(t, yFormat)); }));
  const m = { t: 22, r: 8, b: 36, l: Math.ceil(lw) + 12 };
  const iw = Math.max(10, width - m.l - m.r), ih = Math.max(10, height - m.t - m.b);
  const n = cols.length, bw = iw / Math.max(1, n), barW = Math.min(bw * 0.6, 40);
  const Y = function (v) { return m.t + ih - ((v - yMin) / ((yMax - yMin) || 1)) * ih; };
  const step = tickStep(n, iw, 56);
  const color = function (c) { if (c.total) return 'var(--chart-1)'; const up = c.s.value >= 0; return (up !== invert) ? 'var(--chart-positive)' : 'var(--chart-negative)'; };
  const signed = function (c) { return c.total ? formatValue(c.b, yFormat) : (c.s.value > 0 ? '+' : c.s.value < 0 ? '−' : '') + formatValue(Math.abs(c.s.value), yFormat); };
  return (
    <div ref={ref} className={'gx-chart' + (hover != null ? ' gx-dim' : '') + (className ? ' ' + className : '')} style={style}>
      <svg className="gx-svg" width={width} height={height} role="img" aria-label={ariaLabel || 'Gráfico em cascata'} onPointerMove={function (e) { setHover(bandIndex(e, m.l, iw, n)); }} onPointerLeave={function () { setHover(null); }}>
        {ticks.map(function (t) { return <g key={t}><line x1={m.l} x2={width - m.r} y1={Y(t)} y2={Y(t)} className={t === 0 ? 'gx-base' : 'gx-grid'} /><text x={m.l - 10} y={Y(t)} dy="0.32em" textAnchor="end" className="gx-tick">{formatValue(t, yFormat)}</text></g>; })}
        {hover != null ? <rect className="gx-band" x={m.l + hover * bw + 2} y={m.t - 8} width={bw - 4} height={ih + 8} rx={8} /> : null}
        {cols.map(function (c, i) {
          const x = m.l + i * bw + (bw - barW) / 2; const top = Y(Math.max(c.a, c.b)), bot = Y(Math.min(c.a, c.b));
          const next = cols[i + 1];
          return (
            <g key={i}>
              <path d={barPath(x, top, barW, Math.max(1.5, bot - top), 5, 'all')} fill={color(c)} className={'gx-bar' + (hover === i ? ' is-on' : '')} style={{ animationDelay: i * 40 + 'ms' }} />
              {next ? <line x1={x + barW} x2={m.l + (i + 1) * bw + (bw - barW) / 2} y1={Y(c.b)} y2={Y(c.b)} stroke="var(--chart-baseline)" strokeDasharray="3 3" /> : null}
              {showValues ? <text x={x + barW / 2} y={top - 6} textAnchor="middle" className="gx-val" style={c.total ? null : { fill: color(c) }}>{signed(c)}</text> : null}
            </g>
          );
        })}
        {cols.map(function (c, i) { return i % step === 0 ? <WrapLabel key={'x' + i} x={m.l + i * bw + bw / 2} y={height - 14} maxWidth={bw * step - 4} text={c.s.label} className="gx-tick" style={c.total ? { fill: 'var(--chart-value)', fontWeight: 500 } : null} /> : null; })}
      </svg>
      {hover != null ? <ChartTooltip x={m.l + hover * bw + bw / 2} y={Y(cols[hover].b)} width={width} height={height} title={cols[hover].s.label}
        rows={[{ color: color(cols[hover]), label: cols[hover].total ? 'Total' : 'Variação', value: signed(cols[hover]) }].concat(cols[hover].total ? [] : [{ label: 'Acumulado', value: formatValue(cols[hover].b, yFormat) }])} /> : null}
    </div>
  );
}
