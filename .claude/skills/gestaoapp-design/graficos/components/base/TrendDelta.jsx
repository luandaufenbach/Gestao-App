import React from 'react';
import { TrendGlyph, formatValue } from './ChartCore.jsx';

export function TrendDelta({ value = 0, format = 'percent', invert = false, variant = 'pill', size = 'md', onBrand = false, label, style }) {
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const good = dir === 'flat' ? null : (dir === 'up') !== invert;
  const tone = good == null ? 'flat' : good ? 'up' : 'down';
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  const txt = sign + formatValue(Math.abs(value), format);
  const cls = 'gx-delta gx-delta--' + tone + (variant === 'pill' ? ' gx-delta--pill' : '') + (size === 'sm' ? ' gx-delta--sm' : '') + (onBrand ? ' gx-delta--on-brand' : '');
  return (
    <span className={cls} style={style} aria-label={(label ? label + ': ' : '') + txt + (good == null ? '' : good ? ' (melhora)' : ' (piora)')}>
      <TrendGlyph dir={dir} size={size === 'sm' ? 11 : 12} />{txt}
    </span>
  );
}
