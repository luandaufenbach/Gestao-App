import React from 'react';

// Shared helpers for gestaoApp · Gráficos (scales, formatters, paths, tooltip). Not a public component.
export const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)'];
export const CHART_ON = ['var(--chart-on-1)', 'var(--chart-on-2)', 'var(--chart-on-3)', 'var(--chart-on-4)', 'var(--chart-on-5)', 'var(--chart-on-6)', 'var(--chart-on-7)', 'var(--chart-on-8)'];
export const SEQ = ['var(--chart-seq-0)', 'var(--chart-seq-1)', 'var(--chart-seq-2)', 'var(--chart-seq-3)', 'var(--chart-seq-4)', 'var(--chart-seq-5)', 'var(--chart-seq-6)', 'var(--chart-seq-7)'];

export function seriesColor(i, c) { return c || CHART_COLORS[i % CHART_COLORS.length]; }

export function useMeasure(initial) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(initial || 560);
  React.useLayoutEffect(function () {
    const el = ref.current; if (!el) return undefined;
    const set = function () { const v = Math.round(el.getBoundingClientRect().width); if (v > 0) setW(v); };
    set();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(set); ro.observe(el);
    return function () { ro.disconnect(); };
  }, []);
  return [ref, w];
}

export function useUid(prefix) {
  const id = React.useId ? React.useId() : String(Math.random());
  return (prefix || 'gx') + String(id).replace(/[^a-zA-Z0-9]/g, '');
}

export function niceTicks(min, max, count) {
  count = count || 4;
  if (!isFinite(min) || !isFinite(max)) { min = 0; max = 1; }
  if (min === max) { max = min === 0 ? 1 : min * 1.2; }
  const step0 = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const err = step0 / mag;
  const step = (err >= 7.07 ? 10 : err >= 3.16 ? 5 : err >= 1.41 ? 2 : 1) * mag;
  const lo = Math.floor(min / step + 1e-9) * step, hi = Math.ceil(max / step - 1e-9) * step;
  const out = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v / step) * step);
  return out;
}

const NF = {};
function nf(o) { const k = JSON.stringify(o); return NF[k] || (NF[k] = new Intl.NumberFormat('pt-BR', o)); }
export function formatValue(v, f) {
  if (v == null || (typeof v === 'number' && isNaN(v))) return '—';
  if (typeof f === 'function') return f(v);
  if (typeof v !== 'number') return String(v);
  switch (f) {
    case 'percent': return nf({ maximumFractionDigits: 1 }).format(v) + '%';
    case 'pp': return nf({ maximumFractionDigits: 1 }).format(v) + ' pp';
    case 'compact': return nf({ notation: 'compact', maximumFractionDigits: 1 }).format(v);
    case 'currency': return nf({ style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
    case 'currencyCompact': return 'R$ ' + nf({ notation: 'compact', maximumFractionDigits: 1 }).format(v);
    case 'hours': return nf({ maximumFractionDigits: 1 }).format(v) + ' h';
    case 'days': return nf({ maximumFractionDigits: 1 }).format(v) + (Math.abs(v) === 1 ? ' dia' : ' dias');
    case 'decimal': return nf({ minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);
    default: return nf({ maximumFractionDigits: 1 }).format(v);
  }
}

export function tickCount(height) { return Math.max(2, Math.min(6, Math.round((height - 40) / 46))); }

export function tipY(pointY, top, innerH) { return pointY < top + innerH / 2 ? pointY + 64 : pointY - 64; }

export function WrapLabel({ x, y, text, maxWidth, className, style }) {
  const s = String(text);
  if (textWidth(s) <= maxWidth || s.indexOf(' ') < 0) return <text x={x} y={y} textAnchor="middle" className={className} style={style}>{s}</text>;
  const words = s.split(' '); let best = 1, diff = Infinity;
  for (let i = 1; i < words.length; i++) { const d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length); if (d < diff) { diff = d; best = i; } }
  return <text x={x} y={y - 6} textAnchor="middle" className={className} style={style}><tspan x={x}>{words.slice(0, best).join(' ')}</tspan><tspan x={x} dy="1.15em">{words.slice(best).join(' ')}</tspan></text>;
}

export function textWidth(s, px) { return String(s).length * (px || 11) * 0.56; }
export function tickStep(n, width, gap) { const fit = Math.max(1, Math.floor(width / (gap || 46))); return Math.max(1, Math.ceil(n / fit)); }

export function monotonePath(p) {
  const n = p.length;
  if (!n) return '';
  if (n === 1) return 'M' + p[0][0] + ',' + p[0][1];
  if (n === 2) return 'M' + p[0][0] + ',' + p[0][1] + 'L' + p[1][0] + ',' + p[1][1];
  const dx = [], m = [], t = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = p[i + 1][0] - p[i][0]; m[i] = dx[i] === 0 ? 0 : (p[i + 1][1] - p[i][1]) / dx[i]; }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t[i] = 0;
    else t[i] = 3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  }
  let d = 'M' + p[0][0] + ',' + p[0][1];
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += 'C' + (p[i][0] + h) + ',' + (p[i][1] + h * t[i]) + ',' + (p[i + 1][0] - h) + ',' + (p[i + 1][1] - h * t[i + 1]) + ',' + p[i + 1][0] + ',' + p[i + 1][1];
  }
  return d;
}

export function linePath(p, curve) {
  if (!p.length) return '';
  if (curve === 'linear') return p.map(function (q, i) { return (i ? 'L' : 'M') + q[0] + ',' + q[1]; }).join('');
  if (curve === 'step') {
    let d = 'M' + p[0][0] + ',' + p[0][1];
    for (let i = 1; i < p.length; i++) { const mx = (p[i - 1][0] + p[i][0]) / 2; d += 'H' + mx + 'V' + p[i][1] + 'H' + p[i][0]; }
    return d;
  }
  return monotonePath(p);
}

export function barPath(x, y, w, h, r, dir) {
  if (!(w > 0) || !(h > 0)) return '';
  r = Math.max(0, Math.min(r || 0, w / 2, h));
  if (!r || dir === 'none') return 'M' + x + ',' + y + 'H' + (x + w) + 'V' + (y + h) + 'H' + x + 'Z';
  if (dir === 'down') return 'M' + x + ',' + y + 'H' + (x + w) + 'V' + (y + h - r) + 'Q' + (x + w) + ',' + (y + h) + ' ' + (x + w - r) + ',' + (y + h) + 'H' + (x + r) + 'Q' + x + ',' + (y + h) + ' ' + x + ',' + (y + h - r) + 'Z';
  if (dir === 'all') return 'M' + (x + r) + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h - r) + 'Q' + (x + w) + ',' + (y + h) + ' ' + (x + w - r) + ',' + (y + h) + 'H' + (x + r) + 'Q' + x + ',' + (y + h) + ' ' + x + ',' + (y + h - r) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y + 'Z';
  return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z';
}

const TREND = { up: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>', down: '<path d="m7 7 10 10"/><path d="M17 7v10H7"/>', flat: '<path d="M5 12h14"/>' };
export function TrendGlyph({ dir = 'up', size = 12 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }} dangerouslySetInnerHTML={{ __html: TREND[dir] || TREND.flat }} />;
}

export function ChartTooltip({ x, y, width, height, title, rows = [], footer }) {
  if (x == null) return null;
  const flip = x > width * 0.58;
  const top = Math.max(52, Math.min((height || 200) - 52, y));
  return (
    <div className="gx-tip" style={{ left: x, top: top, transform: 'translate(' + (flip ? 'calc(-100% - 14px)' : '14px') + ', -50%)' }} role="status" aria-live="polite">
      {title != null ? <div className="gx-tip__t">{title}</div> : null}
      {rows.map(function (r, i) {
        return (
          <div className="gx-tip__r" key={i}>
            {r.color ? <span className="gx-tip__sw" style={{ background: r.color }} data-dashed={r.dashed ? '' : undefined} /> : null}
            <span className="gx-tip__l">{r.label}</span>
            <span className="gx-tip__v">{r.value}</span>
          </div>
        );
      })}
      {footer ? <div className="gx-tip__f">{footer}</div> : null}
    </div>
  );
}

export function SrTable({ caption, head = [], rows = [] }) {
  return (
    <table className="gx-sr">
      {caption ? <caption>{caption}</caption> : null}
      <thead><tr>{head.map(function (h, i) { return <th key={i} scope="col">{h}</th>; })}</tr></thead>
      <tbody>{rows.map(function (r, i) { return <tr key={i}>{r.map(function (c, j) { return <td key={j}>{c}</td>; })}</tr>; })}</tbody>
    </table>
  );
}

export function pointerIndex(e, left, innerWidth, n) {
  const r = e.currentTarget.getBoundingClientRect();
  const px = e.clientX - r.left;
  if (n <= 1) return 0;
  return Math.max(0, Math.min(n - 1, Math.round(((px - left) / innerWidth) * (n - 1))));
}

export function bandIndex(e, left, innerWidth, n) {
  const r = e.currentTarget.getBoundingClientRect();
  const px = e.clientX - r.left - left;
  if (px < 0 || px > innerWidth) return null;
  return Math.max(0, Math.min(n - 1, Math.floor((px / innerWidth) * n)));
}
