import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { IconButton } from '../core/IconButton.jsx';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

const TONES = {
  brand: ['var(--brand-primary-soft)', 'var(--brand-primary)'],
  success: ['var(--feedback-success-bg)', 'var(--green-600)'],
  warning: ['var(--feedback-warning-bg)', 'var(--orange-500)'],
  danger: ['var(--feedback-danger-bg)', 'var(--red-500)'],
  accent: ['var(--accent)', 'var(--ink-950)'],
  violet: ['var(--violet-50)', 'var(--violet-500)']
};

export function StatCard({ icon = 'calendar', tone = 'brand', label, value, delta, deltaTrend, caption, onMore, compact = false, className, style }) {
  const t = TONES[tone] || TONES.brand;
  return (
    <div className={cx('ga-card ga-stat', compact && 'ga-stat--compact ga-card--pad-sm', className)} style={style}>
      <div className="ga-stat__head">
        <span className="ga-stat__icon" style={{ '--t-bg': t[0], '--t-fg': t[1] }}><Icon name={icon} size={15} strokeWidth={2} /></span>
        <span className="ga-stat__label">{label}</span>
        {onMore ? <IconButton icon="ellipsis" label="Mais" size="sm" onClick={onMore} style={{ margin: '-4px -6px -4px 0' }} /> : null}
      </div>
      <div className="ga-stat__row">
        <span className="ga-stat__value">{value}</span>
        {delta ? (
          <span className={cx('ga-stat__delta', deltaTrend && 'ga-stat__delta--' + deltaTrend)}>
            {deltaTrend === 'up' ? <Icon name="arrow-up" size={12} strokeWidth={2.25} /> : null}{delta}
          </span>
        ) : null}
        {caption ? <span className="ga-stat__delta">{caption}</span> : null}
      </div>
    </div>
  );
}
