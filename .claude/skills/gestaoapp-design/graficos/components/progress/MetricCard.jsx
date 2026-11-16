import React from 'react';
import { TrendDelta } from '../base/TrendDelta.jsx';
import { Sparkline } from './Sparkline.jsx';
import { formatValue } from '../base/ChartCore.jsx';

export function MetricCard({ label, value, unit, format, delta, deltaFormat = 'percent', invert = false, comparison = 'vs período anterior', spark, sparkVariant = 'area', sparkColor, icon, variant = 'default', compact = false, onClick, footer, className, style }) {
  const brand = variant === 'brand';
  return (
    <div className={'gx-metric' + (brand ? ' gx-metric--brand' : '') + (compact ? ' gx-metric--compact' : '') + (onClick ? ' gx-metric--click' : '') + (className ? ' ' + className : '')} style={style} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className="gx-metric__head">
        {icon ? <span className="gx-metric__icon">{icon}</span> : null}
        <span className="gx-metric__label">{label}</span>
      </div>
      <div className="gx-metric__row">
        <span className="gx-metric__value">{typeof value === 'number' ? formatValue(value, format) : value}{unit ? <span className="gx-metric__unit" style={brand ? { color: 'rgba(255,255,255,.7)' } : null}>{unit}</span> : null}</span>
        {delta != null ? <TrendDelta value={delta} format={deltaFormat} invert={invert} size="sm" onBrand={brand} label={comparison} /> : null}
      </div>
      {spark && spark.length ? <Sparkline data={spark} variant={sparkVariant} height={compact ? 28 : 40} color={sparkColor || (brand ? 'var(--chart-highlight)' : undefined)} /> : null}
      {comparison && delta != null ? <span className="gx-metric__cmp">{comparison}</span> : null}
      {footer || null}
    </div>
  );
}
