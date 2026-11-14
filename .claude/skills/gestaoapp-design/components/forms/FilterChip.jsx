import React from 'react';
import { Icon } from '../core/Icon.jsx';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function FilterChip({ label, icon, active = false, onClick, onRemove, dropdown = true, size = 'md', className, style }) {
  return (
    <span role="button" tabIndex={0} onClick={onClick} className={cx('ga-chip', active && 'ga-chip--active', size === 'sm' && 'ga-chip--sm', className)} style={style}>
      {icon ? <Icon name={icon} size={14} /> : null}
      <span>{label}</span>
      {active && onRemove ? (
        <button type="button" className="ga-chip__x" aria-label={'Remover filtro ' + label} onClick={function (e) { e.stopPropagation(); onRemove(); }}><Icon name="x" size={12} strokeWidth={2.25} /></button>
      ) : dropdown ? <Icon name="chevron-down" size={13} /> : null}
    </span>
  );
}
