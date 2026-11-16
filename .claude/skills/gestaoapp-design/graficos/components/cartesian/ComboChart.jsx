import React from 'react';
import { useMeasure, niceTicks, formatValue, barPath, linePath, textWidth, tickStep, tickCount, bandIndex, ChartTooltip, SrTable } from '../base/ChartCore.jsx';

export function ComboChart({ data = [], xKey = 'label', bar, line, height = 260, yFormat, y2Format = 'percent', y2Domain, highlight, hidden = [], tooltip = true, ariaLabel, className, style }) {
  const [ref, width] = useMeasure();
  const [hover, setHover] = React.useState(null);
  const n = data.length;
  const B = bar && hidden.indexOf(bar.key) < 0 ? bar : null;
  const L = line && hidden.indexOf(line.key) < 0 ? line : null;
  const bColor = (bar && bar.color) || 'var(--chart-seq-3)', lColor = (line && line.color) || 'var(--chart-1)';
  let hi = 0; data.forEach(function (d) { hi = Math.max(hi, (bar && d[bar.key]) || 0); });
  const t1 = niceTicks(0, hi || 1, tickCount(height));
  let l2 = Infinity, h2 = -Infinity; data.forEach(function (d) { const v = line && d[line.key]; if (v != null) { l2 = Math.min(l2, v); h2 = Math.max(h2, v); } });
  const t2 = y2Domain ? niceTicks(y2Domain[0], y2Domain[1], tickCount(height)) : niceTicks(Math.min(0, l2), h2, tickCount(height));
  const y2Min = y2Domain ? y2Domain[0] : t2[0], y2Max = y2Domain ? y2Domain[1] : t2[t2.length - 1];
  const lw = Math.max.apply(null, t1.map(function (t) { return textWidth(formatValue(t, yFormat)); }));
  const rw = Math.max.apply(null, t2.map(function (t) { return textWidth(formatValue(t, y2Format)); }));
  const m = { t: 12, r: Math.ceil(rw) + 12, b: 28, l: Math.ceil(lw) + 12 };
  const iw = Math.max(10, width - m.l - m.r), ih = Math.max(10, height - m.t - m.b);
  const bw = iw / Math.max(1, n), barW = Math.min(bw * 0.58, 36);
  const Y1 = function (v) { return m.t + ih - (v / (t1[t1.length - 1] || 1)) * ih; };
  const Y2 = function (v) { return m.t + ih - ((v - y2Min) / ((y2Max - y2Min) || 1)) * ih; };
  const cx = function (i) { return m.l + i * bw + bw / 2; };
  const step = tickStep(n, iw, 44);
  const pts = []; data.forEach(function (d, i) { if (L && d[L.key] != null) pts.push([cx(i), Y2(d[L.key])]); });
  const lab = function (i) { return data[i][xKey]; };
  const isHl = function (d, i) { return typeof highlight === 'function' ? highlight(d, i) : highlight === i; };
  return (
    <div ref={ref} className={'gx-chart' + (hover != null ? ' gx-dim' : '') + (className ? ' ' + className : '')} style={style}>
      <svg className="gx-svg" width={width} height={height} role="img" aria-label={ariaLabel || ((bar ? bar.label : '') + ' e ' + (line ? line.label : ''))}
        onPointerMove={function (e) { setHover(bandIndex(e, m.l, iw, n)); }} onPointerLeave={function () { setHover(null); }}>
        {t1.map(function (t, i) { return <g key={t}><line x1={m.l} x2={width - m.r} y1={Y1(t)} y2={Y1(t)} className={t === 0 ? 'gx-base' : 'gx-grid'} /><text x={m.l - 10} y={Y1(t)} dy="0.32em" textAnchor="end" className="gx-tick">{formatValue(t, yFormat)}</text></g>; })}
        {t2.map(function (t) { return <text key={'r' + t} x={width - m.r + 10} y={Y2(t)} dy="0.32em" textAnchor="start" className="gx-tick" style={{ fill: lColor }}>{formatValue(t, y2Format)}</text>; })}
        {hover != null ? <rect className="gx-band" x={m.l + hover * bw + 2} y={m.t - 6} width={bw - 4} height={ih + 6} rx={8} /> : null}
        {B ? data.map(function (d, i) { const v = d[B.key] || 0; return <path key={i} d={barPath(cx(i) - barW / 2, Y1(v), barW, Math.max(1, Y1(0) - Y1(v)), 6, 'up')} fill={isHl(d, i) ? 'var(--chart-highlight)' : bColor} className={'gx-bar' + (hover === i ? ' is-on' : '')} style={{ animationDelay: Math.min(i * 30, 300) + 'ms' }} />; }) : null}
        {L ? <path key={'l' + n} d={linePath(pts, 'smooth')} stroke={lColor} strokeWidth={2.5} pathLength={1} className="gx-line gx-line--draw" /> : null}
        {L ? pts.map(function (p, i) { return <circle key={i} cx={p[0]} cy={p[1]} r={hover === i ? 5 : 3.5} fill="var(--chart-surface)" stroke={lColor} strokeWidth={2} />; }) : null}
        {data.map(function (d, i) { return i % step === 0 ? <text key={i} x={cx(i)} y={height - 8} textAnchor="middle" className="gx-tick">{lab(i)}</text> : null; })}
      </svg>
      {tooltip && hover != null ? <ChartTooltip x={cx(hover)} y={m.t + ih / 2} width={width} height={height} title={lab(hover)} rows={[
        bar ? { color: bColor, label: bar.label, value: formatValue(data[hover][bar.key], bar.format || yFormat) } : null,
        line ? { color: lColor, label: line.label, value: formatValue(data[hover][line.key], line.format || y2Format) } : null].filter(Boolean)} /> : null}
      <SrTable caption={ariaLabel} head={['', bar ? bar.label : '', line ? line.label : '']} rows={data.map(function (d, i) { return [lab(i), formatValue(bar && d[bar.key], yFormat), formatValue(line && d[line.key], y2Format)]; })} />
    </div>
  );
}
