import React from 'react';
import { formatValue, TrendGlyph } from '../base/ChartCore.jsx';

const RAMP = ['var(--chart-seq-6)', 'var(--chart-seq-5)', 'var(--chart-seq-4)', 'var(--chart-seq-3)', 'var(--chart-seq-2)', 'var(--chart-seq-1)'];

export function FunnelChart({ steps = [], format, labelWidth = 140, showConversion = true, colors, ariaLabel, className, style }) {
  const first = steps.length ? steps[0].value || 1 : 1;
  const pal = colors || RAMP;
  const pct = function (a, b) { return formatValue(Math.round((a / (b || 1)) * 1000) / 10, 'percent'); };
  return (
    <div className={'gx-funnel' + (className ? ' ' + className : '')} style={Object.assign({ '--lw': labelWidth + 'px' }, style)} role="list" aria-label={ariaLabel}>
      {steps.map(function (s, i) {
        return (
          <React.Fragment key={i}>
            {i > 0 && showConversion ? <div className="gx-funnel__conv" aria-hidden="true"><span /><span className="gx-funnel__pill"><TrendGlyph dir="down" size={11} />{pct(s.value, steps[i - 1].value)} avançaram</span></div> : null}
            <div className="gx-funnel__row" role="listitem">
              <div className="gx-funnel__meta"><span className="gx-funnel__l">{s.label}</span><span className="gx-funnel__v">{formatValue(s.value, format)}{i > 0 ? <small>{pct(s.value, first)}</small> : null}</span></div>
              <div className="gx-funnel__lane"><div className="gx-funnel__bar" style={{ width: Math.max(4, (s.value / first) * 100) + '%', background: s.color || pal[Math.min(i, pal.length - 1)], animationDelay: i * 80 + 'ms' }} /></div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
