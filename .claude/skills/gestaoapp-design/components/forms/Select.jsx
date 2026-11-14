import React from 'react';
import { Icon } from '../core/Icon.jsx';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function Select({ label, hint, icon, options = [], value, defaultValue, onChange, size = 'md', disabled = false, className, style }) {
  return (
    <label className={cx('ga-field', className)} style={style}>
      {label ? <span className="ga-field__label">{label}</span> : null}
      <span className={cx('ga-input', size !== 'md' && 'ga-input--' + size, disabled && 'ga-input--disabled')}>
        {icon ? <span className="ga-input__icon"><Icon name={icon} size={16} /></span> : null}
        <select value={value} defaultValue={defaultValue} onChange={onChange} disabled={disabled}>
          {options.map(function (o) { const v = typeof o === 'string' ? o : o.value; const l = typeof o === 'string' ? o : o.label; return <option key={v} value={v}>{l}</option>; })}
        </select>
        <span className="ga-input__chev"><Icon name="chevron-down" size={15} /></span>
      </span>
      {hint ? <span className="ga-field__hint">{hint}</span> : null}
    </label>
  );
}
