import React from 'react';
import { useMeasure, useUid, niceTicks, formatValue, seriesColor, linePath, textWidth, tickStep, tickCount, tipY, pointerIndex, ChartTooltip, SrTable } from '../base/ChartCore.jsx';

export function LineChart({ data = [], xKey = 'label', series = [], height = 240, yFormat, xFormat, yDomain, curve = 'smooth', area = false, stacked = false, dots = 'hover', references = [], hidden = [], highlightLast = false, tooltip = true, tooltipTitle, ariaLabel, className, style }) {
  const [ref, width] = useMeasure();
  const uid = useUid('gxl');
  const [hover, setHover] = React.useState(null);
  const n = data.length;
  const base = data.map(function () { return 0; });
  const layers = [];
  series.forEach(function (s, si) {
    if (hidden.indexOf(s.key) >= 0) return;
    const color = seriesColor(si, s.color);
    const stack = stacked && !s.dashed;
    const vals = data.map(function (d, i) {
      const v = d[s.key];
      if (v == null) return [null, null, null];
      if (stack) { const y0 = base[i]; base[i] = y0 + v; return [y0, base[i], v]; }
      return [0, v, v];
    });
    layers.push({ s: s, color: color, vals: vals, stack: stack, fill: (area || s.area) && !s.dashed });
  });
  let lo = Infinity, hi = -Infinity;
  layers.forEach(function (l) { l.vals.forEach(function (v) { if (v[1] != null) { lo = Math.min(lo, v[1]); hi = Math.max(hi, v[1]); } }); });
  references.forEach(function (r) { lo = Math.min(lo, r.value); hi = Math.max(hi, r.value); });
  if (!isFinite(lo)) { lo = 0; hi = 1; }
  if (area || stacked || lo > 0) lo = Math.min(0, lo);
  const ticks = yDomain ? niceTicks(yDomain[0], yDomain[1], tickCount(height)) : niceTicks(lo, hi, tickCount(height));
  const yMin = yDomain ? yDomain[0] : ticks[0], yMax = yDomain ? yDomain[1] : ticks[ticks.length - 1];
  const labelW = Math.max.apply(null, ticks.map(function (t) { return textWidth(formatValue(t, yFormat)); }));
  const m = { t: 12, r: 16, b: 28, l: Math.ceil(labelW) + 12 };
  const iw = Math.max(10, width - m.l - m.r), ih = Math.max(10, height - m.t - m.b);
  const X = function (i) { return m.l + (n <= 1 ? iw / 2 : (i * iw) / (n - 1)); };
  const Y = function (v) { return m.t + ih - ((v - yMin) / ((yMax - yMin) || 1)) * ih; };
  const step = tickStep(n, iw, 52);
  const y0 = Y(Math.max(yMin, Math.min(yMax, 0)));
  const lab = function (i) { const v = data[i][xKey]; return xFormat ? xFormat(v, i) : v; };
  const firstSolid = layers.filter(function (l) { return !l.s.dashed; })[0];

  const paths = layers.map(function (l, li) {
    const idx = [];
    l.vals.forEach(function (v, i) { if (v[1] != null) idx.push(i); });
    const top = idx.map(function (i) { return [X(i), Y(l.vals[i][1])]; });
    let areaD = null;
    if (l.fill && top.length > 1) {
      if (l.stack) {
        const bot = idx.map(function (i) { return [X(i), Y(l.vals[i][0])]; }).reverse();
        areaD = linePath(top, curve) + linePath(bot, curve).replace(/^M/, 'L') + 'Z';
      } else {
        areaD = linePath(top, curve) + 'L' + top[top.length - 1][0] + ',' + y0 + 'L' + top[0][0] + ',' + y0 + 'Z';
      }
    }
    return { l: l, li: li, top: top, idx: idx, line: linePath(top, curve), area: areaD };
  });

  let tip = null;
  if (tooltip && hover != null && layers.length) {
    const ys = layers.map(function (l) { return l.vals[hover][1]; }).filter(function (v) { return v != null; });
    tip = <ChartTooltip x={X(hover)} y={ys.length ? tipY(Y(Math.max.apply(null, ys)), m.t, ih) : m.t + ih / 2} width={width} height={height}
      title={tooltipTitle ? tooltipTitle(data[hover], hover) : lab(hover)}
      rows={layers.map(function (l) { return { color: l.color, dashed: l.s.dashed, label: l.s.label, value: formatValue(l.vals[hover][2], l.s.format || yFormat) }; })} />;
  }

  return (
    <div ref={ref} className={'gx-chart' + (className ? ' ' + className : '')} style={style}>
      <svg className="gx-svg" width={width} height={height} role="img" aria-label={ariaLabel || series.map(function (s) { return s.label; }).join(', ')}
        onPointerMove={tooltip ? function (e) { setHover(pointerIndex(e, m.l, iw, n)); } : undefined} onPointerLeave={function () { setHover(null); }}>
        <defs>
          {paths.map(function (p) { return p.area ? <linearGradient key={p.li} id={uid + p.li} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={p.l.color} stopOpacity={p.l.stack ? 0.34 : 0.2} /><stop offset="100%" stopColor={p.l.color} stopOpacity={p.l.stack ? 0.14 : 0.01} /></linearGradient> : null; })}
        </defs>
        {ticks.map(function (t) {
          return <g key={t}><line x1={m.l} x2={width - m.r} y1={Y(t)} y2={Y(t)} className={t === 0 ? 'gx-base' : 'gx-grid'} /><text x={m.l - 10} y={Y(t)} dy="0.32em" textAnchor="end" className="gx-tick">{formatValue(t, yFormat)}</text></g>;
        })}
        {data.map(function (d, i) { return i % step === 0 ? <text key={i} x={X(i)} y={height - 8} textAnchor="middle" className="gx-tick">{lab(i)}</text> : null; })}
        {hover != null ? <line x1={X(hover)} x2={X(hover)} y1={m.t} y2={m.t + ih} className="gx-cross" /> : null}
        {paths.map(function (p) { return p.area ? <path key={'a' + p.li} d={p.area} fill={'url(#' + uid + p.li + ')'} className="gx-area" /> : null; })}
        {references.map(function (r, i) {
          return <g key={'r' + i}><line x1={m.l} x2={width - m.r} y1={Y(r.value)} y2={Y(r.value)} className={'gx-ref' + (r.tone ? ' gx-ref--' + r.tone : '')} />{r.label ? <text x={width - m.r} y={Y(r.value) - 6} textAnchor="end" className="gx-ref-label">{r.label}</text> : null}</g>;
        })}
        {paths.map(function (p) {
          return <path key={'l' + p.li + '-' + n} d={p.line} stroke={p.l.color} strokeWidth={p.l.s.dashed ? 2 : 2.5} strokeDasharray={p.l.s.dashed ? '5 5' : undefined} pathLength={p.l.s.dashed ? undefined : 1} className={'gx-line' + (p.l.s.dashed ? '' : ' gx-line--draw')} />;
        })}
        {dots === 'always' ? paths.map(function (p) { return p.top.map(function (q, k) { return <circle key={p.li + '-' + k} cx={q[0]} cy={q[1]} r={3.5} fill={p.l.color} className="gx-dot" />; }); }) : null}
        {highlightLast && firstSolid && hover == null ? (function () {
          const p = paths.filter(function (x) { return x.l === firstSolid; })[0];
          const q = p.top[p.top.length - 1];
          return q ? <g><circle cx={q[0]} cy={q[1]} r={4} stroke={p.l.color} className="gx-pulse" /><circle cx={q[0]} cy={q[1]} r={4.5} fill={p.l.color} className="gx-dot" /></g> : null;
        })() : null}
        {hover != null ? layers.map(function (l, li) { const v = l.vals[hover][1]; return v == null ? null : <circle key={'h' + li} cx={X(hover)} cy={Y(v)} r={4.5} fill={l.s.dashed ? 'var(--chart-surface)' : l.color} stroke={l.s.dashed ? l.color : undefined} strokeWidth={l.s.dashed ? 2 : undefined} className={l.s.dashed ? '' : 'gx-dot'} />; }) : null}
      </svg>
      {tip}
      <SrTable caption={ariaLabel} head={[''].concat(layers.map(function (l) { return l.s.label; }))} rows={data.map(function (d, i) { return [lab(i)].concat(layers.map(function (l) { return formatValue(l.vals[i][2], l.s.format || yFormat); })); })} />
    </div>
  );
}
