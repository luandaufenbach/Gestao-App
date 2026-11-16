import React from 'react';
import { formatValue, niceTicks } from '../base/ChartCore.jsx';

const BANDS = ['var(--chart-seq-0)', 'color-mix(in oklab, var(--chart-seq-0) 55%, var(--chart-grid))', 'var(--chart-grid)'];

export function BulletChart({ rows = [], format, max, labelWidth = 140, valueWidth = 104, color = 'var(--chart-1)', overColor = 'var(--chart-negative)', overIsBad = false, showScale = true, ariaLabel, className, style }) {
  const mx = max || niceTicks(0, Math.max.apply(null, rows.map(function (r) { return Math.max(r.value, r.target || 0, (r.ranges || []).slice(-1)[0] || 0); }).concat([1])), 4).slice(-1)[0];
  return (
    <div className={'gx-bullet' + (className ? ' ' + className : '')} style={Object.assign({ '--lw': labelWidth + 'px', '--vw': valueWidth + 'px' }, style)} role="list" aria-label={ariaLabel}>
      {rows.map(function (r, i) {
        const ranges = r.ranges || [];
        let prev = 0;
        const over = overIsBad && r.target != null && r.value > r.target;
        return (
          <div key={i} className="gx-bullet__row" role="listitem" aria-label={r.label + ': ' + formatValue(r.value, format) + (r.target != null ? ' de ' + formatValue(r.target, format) : '')}>
            <span className="gx-bullet__l"><span>{r.label}</span>{r.sub ? <small>{r.sub}</small> : null}</span>
            <span className="gx-bullet__lane" style={{ background: ranges.length ? 'transparent' : 'var(--chart-track)' }}>
              {ranges.map(function (to, j) { const w = ((Math.min(to, mx) - prev) / mx) * 100; prev = to; return <span key={j} className="gx-bullet__range" style={{ width: w + '%', background: BANDS[j % BANDS.length] }} />; })}
              {ranges.length && prev < mx ? <span className="gx-bullet__range" style={{ flex: 1, background: BANDS[Math.min(ranges.length, BANDS.length - 1)] }} /> : null}
              <span className="gx-bullet__bar" style={{ width: Math.min(100, (r.value / mx) * 100) + '%', background: over ? overColor : (r.color || color), animationDelay: i * 60 + 'ms' }} />
              {r.target != null ? <span className="gx-bullet__target" style={{ left: Math.min(100, (r.target / mx) * 100) + '%' }} /> : null}
            </span>
            <span className="gx-bullet__v">{formatValue(r.value, format)}{r.target != null ? <small> / {formatValue(r.target, format)}</small> : null}</span>
          </div>
        );
      })}
      {showScale ? <div className="gx-bullet__row" aria-hidden="true" style={{ marginTop: -8 }}><span /><span className="gx-bullet__scale"><span>0</span><span>{formatValue(Math.round(mx / 2), format)}</span><span>{formatValue(Math.round(mx), format)}</span></span><span /></div> : null}
    </div>
  );
}
