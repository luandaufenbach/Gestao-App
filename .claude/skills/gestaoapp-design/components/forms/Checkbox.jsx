import React from 'react';
import { Icon } from '../core/Icon.jsx';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function Checkbox({ checked, defaultChecked, onChange, label, description, shape = 'square', size = 'md', strike = false, disabled = false, className, style, ariaLabel }) {
  const done = strike && checked;
  return (
    <label className={cx('ga-check', shape === 'round' && 'ga-check--round', size === 'lg' && 'ga-check--lg', done && 'ga-check--done', disabled && 'ga-check--disabled', className)} style={style}>
      <input type="checkbox" checked={checked} defaultChecked={defaultChecked} onChange={onChange} disabled={disabled} aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)} />
      <span className="ga-check__box"><Icon name="check" size={size === 'lg' ? 14 : 12} strokeWidth={3} /></span>
      {label || description ? (
        <span className="ga-check__text">
          {label ? <span className="ga-check__label">{label}</span> : null}
          {description ? <span className="ga-check__desc">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
}
