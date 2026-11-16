import React from 'react';
import { useMeasure, formatValue, textWidth, ChartTooltip } from '../base/ChartCore.jsx';

const STEPS = ['var(--chart-seq-1)', 'var(--chart-seq-2)', 'var(--chart-seq-3)', 'var(--chart-seq-4)', 'var(--chart-seq-5)'];

export function Heatmap({ rows = [], cols = [], values = [], format, max, cellGap = 3, radius = 4, maxCell = 34, minCell = 9, colLabelEvery, legend = true, legendLabels = ['Menos', 'Mais'], colors = STEPS, emptyColor = 'var(--chart-seq-0)', ariaLabel, className, style }) {
  const [ref, width] = useMeasure();
  const [hover, setHover] = React.useState(null);
  const mx = max || Math.max.apply(null, values.map(function (r) { return Math.max.apply(null, r.map(function (v) { return v || 0; })); }).concat([1]));
  const lw = Math.ceil(Math.max.apply(null, rows.map(function (r) { return textWidth(r); }).concat([0]))) + 10;
  const nc = cols.length || 1;
  const cell = Math.max(minCell, Math.min(maxCell, Math.floor((width - lw - cellGap * (nc - 1)) / nc)));
  const gw = lw + nc * cell + (nc - 1) * cellGap;
  const top = 18;
  const h = top + rows.length * (cell + cellGap);
  const every = colLabelEvery || Math.max(1, Math.ceil(28 / (cell + cellGap)));
  const color = function (v) { if (!v) return emptyColor; const k = Math.min(colors.length - 1, Math.floor((v / mx) * colors.length - 1e-9)); return colors[Math.max(0, k)]; };
  const hv = hover ? values[hover[0]][hover[1]] : null;
  return (
    <div ref={ref} className={'gx-chart gx-heat' + (className ? ' ' + className : '')} style={style}>
      <div style={{ overflowX: gw > width ? 'auto' : 'visible' }}>
        <svg className="gx-svg" width={Math.max(gw, 10)} height={h} role="img" aria-label={ariaLabel || 'Mapa de calor'} onPointerLeave={function () { setHover(null); }}>
          {cols.map(function (c, j) { return j % every === 0 ? <text key={j} x={lw + j * (cell + cellGap) + cell / 2} y={11} textAnchor="middle" className="gx-tick">{c}</text> : null; })}
          {rows.map(function (r, i) {
            return (
              <g key={i}>
                <text x={0} y={top + i * (cell + cellGap) + cell / 2} dy="0.32em" className="gx-tick">{r}</text>
                {cols.map(function (c, j) { const v = (values[i] || [])[j]; return <rect key={j} className="gx-heat__cell" x={lw + j * (cell + cellGap)} y={top + i * (cell + cellGap)} width={cell} height={cell} rx={Math.min(radius, cell / 3)} fill={color(v)} onPointerEnter={function () { setHover([i, j]); }} />; })}
              </g>
            );
          })}
        </svg>
      </div>
      {hover ? <ChartTooltip x={lw + hover[1] * (cell + cellGap) + cell / 2} y={top + hover[0] * (cell + cellGap) + cell / 2} width={Math.min(width, gw)} height={h} title={rows[hover[0]] + ' · ' + cols[hover[1]]} rows={[{ color: color(hv), label: 'Valor', value: formatValue(hv || 0, format) }]} /> : null}
      {legend ? <div className="gx-heat__legend"><span>{legendLabels[0]}</span><i style={{ background: emptyColor }} />{colors.map(function (c, k) { return <i key={k} style={{ background: c }} />; })}<span>{legendLabels[1]}</span></div> : null}
    </div>
  );
}
