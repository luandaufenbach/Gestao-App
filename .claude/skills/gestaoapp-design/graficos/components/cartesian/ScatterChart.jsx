import React from 'react';
import { useMeasure, niceTicks, formatValue, seriesColor, textWidth, tickCount, ChartTooltip } from '../base/ChartCore.jsx';

export function ScatterChart({ points = [], groups = [], height = 280, xFormat, yFormat, xLabel, yLabel, sizeRange = [6, 22], bubble = false, quadrants, hidden = [], onSelect, ariaLabel, className, style }) {
  const [ref, width] = useMeasure();
  const [hover, setHover] = React.useState(null);
  const gColor = {}; groups.forEach(function (g, i) { gColor[g.key] = seriesColor(i, g.color); });
  const pts = points.filter(function (p) { return !p.group || hidden.indexOf(p.group) < 0; });
  let xl = Infinity, xh = -Infinity, yl = Infinity, yh = -Infinity, rl = Infinity, rh = -Infinity;
  points.forEach(function (p) { xl = Math.min(xl, p.x); xh = Math.max(xh, p.x); yl = Math.min(yl, p.y); yh = Math.max(yh, p.y); if (p.size != null) { rl = Math.min(rl, p.size); rh = Math.max(rh, p.size); } });
  const xt = niceTicks(Math.min(0, xl), xh, 4), yt = niceTicks(Math.min(0, yl), yh, tickCount(height));
  const lw = Math.max.apply(null, yt.map(function (t) { return textWidth(formatValue(t, yFormat)); }));
  const m = { t: 14, r: 18, b: xLabel ? 44 : 28, l: Math.ceil(lw) + (yLabel ? 30 : 12) };
  const iw = Math.max(10, width - m.l - m.r), ih = Math.max(10, height - m.t - m.b);
  const X = function (v) { return m.l + ((v - xt[0]) / ((xt[xt.length - 1] - xt[0]) || 1)) * iw; };
  const Y = function (v) { return m.t + ih - ((v - yt[0]) / ((yt[yt.length - 1] - yt[0]) || 1)) * ih; };
  const R = function (p) { if (!bubble || p.size == null || rh === rl) return bubble ? (sizeRange[0] + sizeRange[1]) / 2 : 6; return sizeRange[0] + Math.sqrt((p.size - rl) / (rh - rl)) * (sizeRange[1] - sizeRange[0]); };
  const sorted = pts.slice().sort(function (a, b) { return (b.size || 0) - (a.size || 0); });
  const hp = hover != null ? pts[hover] : null;
  return (
    <div ref={ref} className={'gx-chart' + (className ? ' ' + className : '')} style={style}>
      <svg className="gx-svg" width={width} height={height} role="img" aria-label={ariaLabel || 'Gráfico de dispersão'}>
        {yt.map(function (t) { return <g key={'y' + t}><line x1={m.l} x2={width - m.r} y1={Y(t)} y2={Y(t)} className={t === 0 ? 'gx-base' : 'gx-grid'} /><text x={m.l - 10} y={Y(t)} dy="0.32em" textAnchor="end" className="gx-tick">{formatValue(t, yFormat)}</text></g>; })}
        {xt.map(function (t) { return <g key={'x' + t}><line x1={X(t)} x2={X(t)} y1={m.t} y2={m.t + ih} className="gx-grid" /><text x={X(t)} y={m.t + ih + 18} textAnchor="middle" className="gx-tick">{formatValue(t, xFormat)}</text></g>; })}
        {quadrants ? <g><line x1={X(quadrants.x)} x2={X(quadrants.x)} y1={m.t} y2={m.t + ih} className="gx-ref" /><line x1={m.l} x2={width - m.r} y1={Y(quadrants.y)} y2={Y(quadrants.y)} className="gx-ref" />
          </g> : null}
        {xLabel ? <text x={m.l + iw / 2} y={height - 6} textAnchor="middle" className="gx-axis-title">{xLabel}</text> : null}
        {yLabel ? <text transform={'translate(12,' + (m.t + ih / 2) + ') rotate(-90)'} textAnchor="middle" className="gx-axis-title">{yLabel}</text> : null}
        {sorted.map(function (p) {
          const i = pts.indexOf(p); const c = p.color || gColor[p.group] || 'var(--chart-1)'; const on = hover === i;
          return <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={R(p) + (on ? 2 : 0)} fill={c} fillOpacity={bubble ? 0.72 : 0.9} stroke="var(--chart-surface)" strokeWidth={1.5} style={{ cursor: onSelect ? 'pointer' : 'default', transition: 'r 140ms' }}
            onPointerEnter={function () { setHover(i); }} onPointerLeave={function () { setHover(null); }} onClick={onSelect ? function () { onSelect(p); } : undefined} />;
        })}
        {quadrants ? <g>{(quadrants.labels || []).map(function (l, i) { if (!l) return null; const left = i % 2 === 0, top = i < 2; return <text key={i} x={left ? m.l + 8 : width - m.r - 8} y={top ? m.t + 14 : m.t + ih - 8} textAnchor={left ? 'start' : 'end'} className="gx-ref-label">{l}</text>; })}</g> : null}
      </svg>
      {hp ? <ChartTooltip x={X(hp.x)} y={Y(hp.y)} width={width} height={height} title={hp.label} rows={[
        { label: xLabel || 'x', value: formatValue(hp.x, xFormat) }, { label: yLabel || 'y', value: formatValue(hp.y, yFormat) }].concat(hp.size != null ? [{ label: 'Tamanho', value: formatValue(hp.size) }] : [])} /> : null}
    </div>
  );
}
