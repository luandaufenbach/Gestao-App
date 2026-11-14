import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { Kbd } from '../core/Kbd.jsx';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function SearchField({ placeholder = 'Buscar', shortcut = '⌘K', value, defaultValue, onChange, variant = 'default', size = 'md', className, style }) {
  return (
    <label className={cx('ga-input', size !== 'md' && 'ga-input--' + size, variant === 'sunken' && 'ga-input--sunken', className)} style={style}>
      <span className="ga-input__icon"><Icon name="search" size={15} /></span>
      <input type="search" placeholder={placeholder} value={value} defaultValue={defaultValue} onChange={onChange} aria-label={placeholder} />
      {shortcut ? <Kbd>{shortcut}</Kbd> : null}
    </label>
  );
}
