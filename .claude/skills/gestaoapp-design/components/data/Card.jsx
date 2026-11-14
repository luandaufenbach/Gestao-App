import React from 'react';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function Card({ variant = 'default', padding = 'md', title, subtitle, actions, interactive = false, onClick, className, style, children }) {
  return (
    <div onClick={onClick} className={cx('ga-card', variant !== 'default' && 'ga-card--' + variant, padding !== 'md' && 'ga-card--pad-' + padding, (interactive || onClick) && 'ga-card--interactive', className)} style={style}>
      {title || actions ? (
        <div className="ga-card__head">
          <div className="ga-card__titles">
            {title ? <div className="ga-card__title">{title}</div> : null}
            {subtitle ? <div className="ga-card__subtitle">{subtitle}</div> : null}
          </div>
          {actions ? <div className="ga-card__actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
