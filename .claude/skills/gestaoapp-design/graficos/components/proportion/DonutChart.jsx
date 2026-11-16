import React from 'react';
import { formatValue, seriesColor } from '../base/ChartCore.jsx';

export function DonutChart({ data = [], size = 184, thickness = 22, variant = 'donut', centerLabel = 'Total', centerValue, format, legend = 'right', showPercent = true, gap = 2, onSelect, ariaLabel, className, style }) {
  const [hover, setHover] = React.useState(null);
  const items = data.map(function (d, i) { return Object.assign({}, d, { color: seriesColor(i, d.color) }); });
  const total = items.reduce(function (a, d) { return a + (d.value || 0); }, 0);
  const pie = variant === 'pie';
  const sw = pie ? size / 2 : thickness;
  if (pie) gap = 0;
  const r = pie ? size / 4 : (size - thickness) / 2 - 3;
  const C = 2 * Math.PI * r;
  const c = size / 2;
  let acc = 0;
  const segs = items.map(function (d, i) {
    const frac = total ? (d.value || 0) / total : 0;
    const len = Math.max(0, frac * C - (items.length > 1 ? gap : 0));
    const s = { d: d, i: i, len: len, off: -acc * C, frac: frac };
    acc += frac; return s;
  });
  const pct = function (f) { return formatValue(Math.round(f * 1000) / 10, 'percent'); };
  const h = hover != null ? segs[hover] : null;
  return (
    <div className={'gx-donut' + (legend === 'bottom' ? ' gx-donut--bottom' : '') + (className ? ' ' + className : '')} style={style}>
      <div className="gx-donut__fig" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={'0 0 ' + size + ' ' + size} role="img" aria-label={ariaLabel || (centerLabel + ': ' + formatValue(total, format))}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--chart-track)" strokeWidth={sw} />
          <g transform={'rotate(-90 ' + c + ' ' + c + ')'}>
            {segs.map(function (s) {
              return <circle key={s.i} className="gx-donut__seg" cx={c} cy={c} r={r} fill="none" stroke={s.d.color} strokeWidth={hover === s.i && !pie ? sw + 6 : sw}
                strokeDasharray={s.len + ' ' + (C - s.len)} strokeDashoffset={s.off} opacity={hover != null && hover !== s.i ? 0.35 : 1}
                onPointerEnter={function () { setHover(s.i); }} onPointerLeave={function () { setHover(null); }} onClick={onSelect ? function () { onSelect(s.d); } : undefined} />;
            })}
          </g>
        </svg>
        {!pie ? (
          <div className="gx-donut__center">
            <span className="gx-donut__cv">{h ? (showPercent ? pct(h.frac) : formatValue(h.d.value, format)) : (centerValue != null ? centerValue : formatValue(total, format))}</span>
            <span className="gx-donut__cl">{h ? h.d.label : centerLabel}</span>
          </div>
        ) : null}
      </div>
      {legend !== 'none' ? (
        <div className="gx-donut__list">
          {segs.map(function (s) {
            return (
              <div key={s.i} className={'gx-donut__row' + (hover === s.i ? ' is-on' : '')} onPointerEnter={function () { setHover(s.i); }} onPointerLeave={function () { setHover(null); }} onClick={onSelect ? function () { onSelect(s.d); } : undefined} style={onSelect ? { cursor: 'pointer' } : null}>
                <span className="gx-donut__sw" style={{ background: s.d.color }} />
                <span>{s.d.label}</span>
                <span className="gx-donut__v">{formatValue(s.d.value, format)}</span>
                <span className="gx-donut__p">{showPercent ? pct(s.frac) : ''}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
