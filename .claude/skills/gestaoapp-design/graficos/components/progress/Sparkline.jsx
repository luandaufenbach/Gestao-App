import React from 'react';
import { useMeasure, linePath, useUid } from '../base/ChartCore.jsx';

export function Sparkline({ data = [], width, height = 36, variant = 'area', color, trendColor = false, invert = false, showEnd = true, highlightLast = true, strokeWidth = 2, ariaLabel, style }) {
  const [ref, mw] = useMeasure(width || 120);
  const w = width || mw;
  const uid = useUid('gxs');
  const vals = data.map(function (v) { return typeof v === 'number' ? v : (v && v.value) || 0; });
  const n = vals.length;
  const up = n > 1 ? vals[n - 1] >= vals[0] : true;
  const c = color || (trendColor ? ((up !== invert) ? 'var(--chart-positive)' : 'var(--chart-negative)') : 'var(--chart-1)');
  const lo = Math.min.apply(null, vals.concat(variant === 'bar' ? [0] : [])), hi = Math.max.apply(null, vals);
  const pad = 3;
  const X = function (i) { return n <= 1 ? w / 2 : pad + (i * (w - pad * 2)) / (n - 1); };
  const Y = function (v) { return pad + (height - pad * 2) * (1 - (v - lo) / ((hi - lo) || 1)); };
  let body = null;
  if (variant === 'bar') {
    const bw = Math.max(2, (w / Math.max(1, n)) * 0.62);
    body = vals.map(function (v, i) { const x = (i + 0.5) * (w / n) - bw / 2; const y = Y(v); return <rect key={i} x={x} y={y} width={bw} height={Math.max(1.5, height - pad - y)} rx={Math.min(2, bw / 2)} fill={c} opacity={highlightLast && i === n - 1 ? 1 : 0.45} />; });
  } else {
    const pts = vals.map(function (v, i) { return [X(i), Y(v)]; });
    const d = linePath(pts, 'smooth');
    body = (
      <React.Fragment>
        {variant === 'area' && n > 1 ? <React.Fragment><defs><linearGradient id={uid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity={0.22} /><stop offset="100%" stopColor={c} stopOpacity={0} /></linearGradient></defs><path d={d + 'L' + X(n - 1) + ',' + height + 'L' + X(0) + ',' + height + 'Z'} fill={'url(#' + uid + ')'} /></React.Fragment> : null}
        <path d={d} fill="none" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        {showEnd && n ? <circle cx={X(n - 1)} cy={Y(vals[n - 1])} r={3} fill={c} stroke="var(--chart-surface)" strokeWidth={1.5} /> : null}
      </React.Fragment>
    );
  }
  return (
    <span ref={ref} style={Object.assign({ display: 'block', width: width || '100%', lineHeight: 0 }, style)}>
      <svg className="gx-spark" width={w} height={height} role="img" aria-label={ariaLabel || ('Tendência: ' + (up ? 'alta' : 'queda'))}>{body}</svg>
    </span>
  );
}
