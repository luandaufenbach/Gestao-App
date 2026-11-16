import React from 'react';
import { formatValue } from '../base/ChartCore.jsx';

function pt(cx, cy, r, t) { const a = Math.PI * (1 - t); return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; }
function arc(cx, cy, r, t0, t1) { const a = pt(cx, cy, r, t0), b = pt(cx, cy, r, t1); return 'M' + a[0] + ',' + a[1] + 'A' + r + ',' + r + ' 0 0 1 ' + b[0] + ',' + b[1]; }

export function GaugeChart({ value = 0, min = 0, max = 100, target, label, format = 'percent', zones, size = 220, thickness = 16, color, ariaLabel, className, style }) {
  const [shown, setShown] = React.useState(min);
  React.useEffect(function () { const t = setTimeout(function () { setShown(value); }, 40); return function () { clearTimeout(t); }; }, [value]);
  const r = (size - thickness) / 2, cx = size / 2, cy = size / 2;
  const h = size / 2 + thickness / 2 + 4;
  const T = function (v) { return Math.max(0, Math.min(1, (v - min) / ((max - min) || 1))); };
  const zone = zones ? zones.filter(function (z) { return value <= z.to; })[0] || zones[zones.length - 1] : null;
  const c = color || (zone ? zone.color : 'var(--chart-1)');
  const L = Math.PI * r;
  const tp = target != null ? [pt(cx, cy, r - thickness / 2 - 3, T(target)), pt(cx, cy, r + thickness / 2 + 3, T(target))] : null;
  return (
    <div className={'gx-gauge' + (className ? ' ' + className : '')} style={Object.assign({ width: size, maxWidth: '100%', margin: '0 auto' }, style)}>
      <svg width="100%" viewBox={'0 0 ' + size + ' ' + h} role="img" aria-label={ariaLabel || ((label || 'Valor') + ': ' + formatValue(value, format))}>
        <path d={arc(cx, cy, r, 0, 1)} fill="none" stroke="var(--chart-track)" strokeWidth={thickness} strokeLinecap="round" />
        {zones ? zones.map(function (z, i) { const from = i ? zones[i - 1].to : min; return <path key={i} d={arc(cx, cy, r + thickness / 2 + 5, T(from) + (i ? 0.004 : 0), T(z.to) - 0.004)} fill="none" stroke={z.color} strokeWidth={3} strokeLinecap="round" opacity={0.55} />; }) : null}
        <path className="gx-gauge__arc" d={arc(cx, cy, r, 0, 1)} fill="none" stroke={c} strokeWidth={thickness} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - T(shown))} />
        {tp ? <line x1={tp[0][0]} y1={tp[0][1]} x2={tp[1][0]} y2={tp[1][1]} stroke="var(--chart-target)" strokeWidth={3} strokeLinecap="round" /> : null}
        <text x={cx} y={cy - 8} textAnchor="middle" className="gx-gauge__v">{formatValue(value, format)}</text>
        {label ? <text x={cx} y={cy + 12} textAnchor="middle" className="gx-gauge__l">{label}</text> : null}
      </svg>
      <div className="gx-gauge__meta" style={{ padding: '0 ' + (thickness / 2) + 'px' }}><span>{formatValue(min, format)}</span>{target != null ? <span>Meta {formatValue(target, format)}</span> : null}<span>{formatValue(max, format)}</span></div>
    </div>
  );
}
