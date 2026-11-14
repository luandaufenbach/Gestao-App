import React from 'react';

const TONES = { brand: 'var(--brand-primary)', accent: 'var(--accent)', success: 'var(--green-500)', warning: 'var(--orange-500)', danger: 'var(--red-500)', violet: 'var(--violet-500)', lime: 'var(--lime-500)', neutral: 'var(--ink-400)' };
const H = { xs: 4, sm: 6, md: 8 };

export function ProgressBar({ value = 0, max = 100, tone = 'brand', color, size = 'sm', onBrand = false, label, style }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div className={'ga-progress' + (onBrand ? ' ga-progress--on-brand' : '')} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}
      style={Object.assign({ '--h': (H[size] || 6) + 'px', '--c': color || TONES[tone] || TONES.brand }, style)}>
      <div className="ga-progress__fill" style={{ width: pct + '%' }} />
    </div>
  );
}
