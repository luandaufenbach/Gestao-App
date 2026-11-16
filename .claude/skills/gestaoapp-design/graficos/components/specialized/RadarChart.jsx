import React from 'react';
import { useMeasure, formatValue, seriesColor, niceTicks } from '../base/ChartCore.jsx';

export function RadarChart({ axes = [], series = [], max, levels = 4, height = 280, format, hidden = [], ariaLabel, className, style }) {
  const [ref, width] = useMeasure();
  const [hover, setHover] = React.useState(null);
  const k = axes.length;
  const vis = series.map(function (s, i) { return Object.assign({}, s, { color: seriesColor(i, s.color), i: i }); }).filter(function (s) { return hidden.indexOf(s.key || s.label) < 0; });
  const mx = max || niceTicks(0, Math.max.apply(null, series.map(function (s) { return Math.max.apply(null, s.values); }).concat([1])), levels).slice(-1)[0];
  const cx = width / 2, cy = height / 2;
  const R = Math.max(20, Math.min(width / 2 - 64, height / 2 - 26));
  const ang = function (i) { return -Math.PI / 2 + (i * 2 * Math.PI) / k; };
  const P = function (i, v) { const a = ang(i), r = (Math.max(0, v) / mx) * R; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const poly = function (vals) { return vals.map(function (v, i) { return P(i, v).join(','); }).join(' '); };
  return (
    <div ref={ref} className={'gx-chart' + (className ? ' ' + className : '')} style={style}>
      <svg className="gx-svg" width={width} height={height} role="img" aria-label={ariaLabel || 'Gráfico radar: ' + axes.join(', ')}>
        {Array.from({ length: levels }).map(function (_, l) { const v = (mx * (l + 1)) / levels; return <polygon key={l} points={poly(axes.map(function () { return v; }))} fill="none" className="gx-grid" style={{ shapeRendering: 'auto' }} />; })}
        {axes.map(function (a, i) { const p = P(i, mx); return <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} className="gx-grid" style={{ shapeRendering: 'auto' }} />; })}
        {axes.map(function (a, i) {
          const an = ang(i), p = [cx + (R + 14) * Math.cos(an), cy + (R + 14) * Math.sin(an)];
          const anchor = Math.abs(Math.cos(an)) < 0.2 ? 'middle' : Math.cos(an) > 0 ? 'start' : 'end';
          return <text key={'t' + i} x={p[0]} y={p[1]} dy="0.32em" textAnchor={anchor} className="gx-radar-label" style={hover === i ? { fill: 'var(--chart-value)', fontWeight: 500 } : null}>{a}</text>;
        })}
        {vis.map(function (s) {
          return (
            <g key={s.i}>
              <polygon className="gx-radar-poly" points={poly(s.values)} fill={s.color} fillOpacity={s.dashed ? 0 : 0.14} stroke={s.color} strokeWidth={2} strokeDasharray={s.dashed ? '5 4' : undefined} strokeLinejoin="round" />
              {s.values.map(function (v, i) { const p = P(i, v); return <circle key={i} cx={p[0]} cy={p[1]} r={hover === i ? 4.5 : 3} fill={s.dashed ? 'var(--chart-surface)' : s.color} stroke={s.dashed ? s.color : 'var(--chart-surface)'} strokeWidth={1.5} />; })}
            </g>
          );
        })}
        {axes.map(function (a, i) { const p = P(i, mx); return <line key={'h' + i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="transparent" strokeWidth={22} onPointerEnter={function () { setHover(i); }} onPointerLeave={function () { setHover(null); }}><title>{a + ': ' + vis.map(function (s) { return s.label + ' ' + formatValue(s.values[i], format); }).join(' · ')}</title></line>; })}
      </svg>
    </div>
  );
}
