import React from 'react';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function Badge({ tone = 'neutral', size = 'md', dot = false, className, style, children }) {
  return (
    <span className={cx('ga-badge', 'ga-badge--' + tone, size === 'sm' && 'ga-badge--sm', className)} style={style}>
      {dot ? <span className="ga-badge__dot" /> : null}
      {children}
    </span>
  );
}
