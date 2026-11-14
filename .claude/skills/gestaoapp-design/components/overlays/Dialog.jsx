import React from 'react';
import { Icon } from '../core/Icon.jsx';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function Dialog({ open = true, tone = 'default', icon, title, description, actions, onClose, contained = false, children, style }) {
  if (!open) return null;
  return (
    <div className={cx('ga-dialog-wrap', contained && 'ga-dialog-wrap--contained')}>
      <div className="ga-scrim" onClick={onClose} />
      <div role="alertdialog" aria-modal="true" className={cx('ga-dialog', tone === 'danger' && 'ga-dialog--danger')} style={style}>
        {icon ? <span className="ga-dialog__icon"><Icon name={icon} size={20} /></span> : null}
        <div>
          <div className="ga-dialog__title">{title}</div>
          {description ? <p className="ga-dialog__desc">{description}</p> : null}
        </div>
        {children}
        {actions ? <div className="ga-dialog__actions">{actions}</div> : null}
      </div>
    </div>
  );
}
