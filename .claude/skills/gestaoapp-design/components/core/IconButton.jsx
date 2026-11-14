import React from 'react';
import { Icon } from './Icon.jsx';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function IconButton({ icon, label, variant = 'ghost', size = 'md', shape = 'rounded', dot = false, disabled = false, onClick, className, style, ...rest }) {
  const isz = size === 'sm' ? 15 : size === 'lg' ? 20 : 17;
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} style={style}
      className={cx('ga-iconbtn', 'ga-iconbtn--' + variant, size !== 'md' && 'ga-iconbtn--' + size, shape === 'circle' && 'ga-iconbtn--circle', className)} {...rest}>
      <Icon name={icon} size={isz} strokeWidth={variant === 'primary' ? 2.25 : 1.75} />
      {dot ? <span className="ga-iconbtn__dot" /> : null}
    </button>
  );
}
