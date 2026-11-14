import React from 'react';
import { Icon } from '../core/Icon.jsx';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function SegmentedControl({ options = [], value, onChange, size = 'md', block = false, className, style }) {
  return (
    <div role="group" className={cx('ga-seg', size === 'sm' && 'ga-seg--sm', block && 'ga-seg--block', className)} style={style}>
      {options.map(function (o) {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        return (
          <button key={v} type="button" className="ga-seg__item" aria-pressed={value === v} onClick={function () { onChange && onChange(v); }}>
            {o.icon ? <Icon name={o.icon} size={14} /> : null}
            {l}
          </button>
        );
      })}
    </div>
  );
}
