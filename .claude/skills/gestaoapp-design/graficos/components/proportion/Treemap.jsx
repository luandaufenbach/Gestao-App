import React from 'react';
import { useMeasure, formatValue, CHART_COLORS, CHART_ON } from '../base/ChartCore.jsx';

function squarify(items, x, y, w, h) {
  const out = [];
  let rest = items.slice();
  const worst = function (row, side) { let s = 0, mx = 0, mn = Infinity; row.forEach(function (r) { s += r.area; mx = Math.max(mx, r.area); mn = Math.min(mn, r.area); }); return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn)); };
  while (rest.length) {
    const side = Math.min(w, h);
    const row = [rest[0]]; let i = 1;
    while (i < rest.length && worst(row.concat([rest[i]]), side) <= worst(row, side)) { row.push(rest[i]); i++; }
    const s = row.reduce(function (a, r) { return a + r.area; }, 0);
    if (w >= h) { const cw = s / h; let cy = y; row.forEach(function (r) { const rh = r.area / cw; out.push(Object.assign({}, r, { x: x, y: cy, w: cw, h: rh })); cy += rh; }); x += cw; w -= cw; }
    else { const rh = s / w; let cx = x; row.forEach(function (r) { const rw = r.area / rh; out.push(Object.assign({}, r, { x: cx, y: y, w: rw, h: rh })); cx += rw; }); y += rh; h -= rh; }
    rest = rest.slice(i);
  }
  return out;
}

export function Treemap({ data = [], height = 260, format, gap = 3, showPercent = true, onSelect, ariaLabel, className, style }) {
  const [ref, width] = useMeasure();
  const total = data.reduce(function (a, d) { return a + (d.value || 0); }, 0) || 1;
  const items = data.map(function (d, i) { return Object.assign({}, d, { idx: i }); }).filter(function (d) { return d.value > 0; }).sort(function (a, b) { return b.value - a.value; })
    .map(function (d) { return Object.assign({}, d, { area: (d.value / total) * width * height }); });
  const tiles = width > 0 ? squarify(items, 0, 0, width, height) : [];
  return (
    <div ref={ref} className={'gx-tm' + (className ? ' ' + className : '')} style={Object.assign({ height: height }, style)} role="list" aria-label={ariaLabel}>
      {tiles.map(function (t, i) {
        const bg = t.color || CHART_COLORS[t.idx % CHART_COLORS.length];
        const fg = t.color ? (t.ink || '#fff') : CHART_ON[t.idx % CHART_ON.length];
        const big = t.w > 84 && t.h > 52, mid = t.w > 56 && t.h > 30;
        const pct = formatValue(Math.round((t.value / total) * 1000) / 10, 'percent');
        return (
          <div key={t.label} role="listitem" className="gx-tm__tile" title={t.label + ': ' + formatValue(t.value, format) + ' (' + pct + ')'} onClick={onSelect ? function () { onSelect(t); } : undefined}
            style={{ left: t.x, top: t.y, width: Math.max(0, t.w - gap), height: Math.max(0, t.h - gap), background: bg, color: fg, cursor: onSelect ? 'pointer' : 'default', padding: big ? 10 : 6, animationDelay: i * 40 + 'ms' }}>
            {mid ? <span className="gx-tm__l">{t.label}</span> : null}
            {big ? <span className="gx-tm__v">{formatValue(t.value, format)}{showPercent ? <span className="gx-tm__p">{pct}</span> : null}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
