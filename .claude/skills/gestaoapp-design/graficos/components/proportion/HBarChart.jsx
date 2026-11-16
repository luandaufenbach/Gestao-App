import React from 'react';
import { formatValue, seriesColor } from '../base/ChartCore.jsx';

export function HBarChart({ data = [], format, max, color = 'var(--chart-1)', sort = true, showRank = false, highlightFirst = false, labelWidth = 150, valueWidth = 52, barHeight = 10, target, limit, onSelect, ariaLabel, className, style }) {
  let rows = data.slice();
  if (sort) rows.sort(function (a, b) { return b.value - a.value; });
  if (limit) rows = rows.slice(0, limit);
  const mx = max || Math.max.apply(null, rows.map(function (r) { return Math.max(r.value, r.target || 0); }).concat([target || 0, 1]));
  return (
    <div className={'gx-hbar' + (className ? ' ' + className : '')} style={Object.assign({ '--lw': labelWidth + 'px', '--vw': valueWidth + 'px', '--bh': barHeight + 'px' }, style)} role="list" aria-label={ariaLabel}>
      {rows.map(function (r, i) {
        const c = r.color || (highlightFirst && i === 0 ? 'var(--chart-highlight)' : color);
        const t = r.target != null ? r.target : target;
        return (
          <div key={r.label + i} role="listitem" className={'gx-hbar__row' + (onSelect ? ' gx-hbar__row--click' : '')} onClick={onSelect ? function () { onSelect(r); } : undefined}>
            <span className="gx-hbar__label">
              {showRank ? <span className="gx-hbar__rank">{i + 1}</span> : null}
              {r.prefix || null}
              <span className="gx-hbar__text"><span className="gx-hbar__name">{r.label}</span>{r.sub ? <span className="gx-hbar__sub">{r.sub}</span> : null}</span>
            </span>
            <span className="gx-hbar__track">
              <span className="gx-hbar__fill" style={{ width: Math.max(0, Math.min(100, (r.value / mx) * 100)) + '%', background: c, animationDelay: Math.min(i * 50, 400) + 'ms' }} />
              {t != null ? <span className="gx-hbar__target" style={{ left: 'calc(' + Math.min(100, (t / mx) * 100) + '% - 1px)' }} title={'Meta: ' + formatValue(t, format)} /> : null}
            </span>
            <span className="gx-hbar__value">{formatValue(r.value, format)}</span>
          </div>
        );
      })}
    </div>
  );
}
