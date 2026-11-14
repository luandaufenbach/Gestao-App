import React from 'react';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function Switch({ checked, defaultChecked, onChange, label, size = 'md', disabled = false, className, style, ariaLabel }) {
  return (
    <label className={cx('ga-switch', size === 'sm' && 'ga-switch--sm', className)} style={style}>
      <input type="checkbox" role="switch" checked={checked} defaultChecked={defaultChecked} onChange={onChange} disabled={disabled} aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)} />
      <span className="ga-switch__track"><span className="ga-switch__thumb" /></span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
