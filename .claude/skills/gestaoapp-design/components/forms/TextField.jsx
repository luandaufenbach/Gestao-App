import React from 'react';
import { Icon } from '../core/Icon.jsx';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function TextField({ label, hint, error, icon, trailing, size = 'md', variant = 'default', type = 'text', value, defaultValue, placeholder, disabled = false, onChange, onKeyDown, autoFocus, name, id, className, style, inputStyle }) {
  const fid = id || (name ? 'f-' + name : undefined);
  return (
    <label className={cx('ga-field', className)} style={style} htmlFor={fid}>
      {label ? <span className="ga-field__label">{label}</span> : null}
      <span className={cx('ga-input', size !== 'md' && 'ga-input--' + size, variant === 'sunken' && 'ga-input--sunken', error && 'ga-input--error', disabled && 'ga-input--disabled')}>
        {icon ? <span className="ga-input__icon"><Icon name={icon} size={16} /></span> : null}
        <input id={fid} name={name} type={type} value={value} defaultValue={defaultValue} placeholder={placeholder} disabled={disabled} onChange={onChange} onKeyDown={onKeyDown} autoFocus={autoFocus} style={inputStyle} />
        {trailing || null}
      </span>
      {error ? <span className="ga-field__hint ga-field__hint--error">{error}</span> : hint ? <span className="ga-field__hint">{hint}</span> : null}
    </label>
  );
}
