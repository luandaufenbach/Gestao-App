import React from 'react';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function Radio({ name, value, checked, defaultChecked, onChange, label, description, disabled = false, className, style }) {
  return (
    <label className={cx('ga-check ga-radio', disabled && 'ga-check--disabled', className)} style={style}>
      <input type="radio" name={name} value={value} checked={checked} defaultChecked={defaultChecked} onChange={onChange} disabled={disabled} />
      <span className="ga-check__box" />
      {label || description ? (
        <span className="ga-check__text">
          {label ? <span className="ga-check__label">{label}</span> : null}
          {description ? <span className="ga-check__desc">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
}
