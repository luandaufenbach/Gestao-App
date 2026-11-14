import React from 'react';
import { IconButton } from '../core/IconButton.jsx';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function Drawer({ open = true, mode = 'overlay', title, headerActions, footer, onClose, children, className, style }) {
  if (!open) return null;
  const panel = (
    <aside role="dialog" aria-label={typeof title === 'string' ? title : undefined} className={cx('ga-drawer', mode === 'inline' && 'ga-drawer--inline', mode === 'contained' && 'ga-drawer--contained', className)} style={style}>
      <div className="ga-drawer__head">
        <div className="ga-drawer__title">{title}</div>
        {headerActions || null}
        {onClose ? <IconButton icon="x" label="Fechar" size="sm" onClick={onClose} /> : null}
      </div>
      <div className="ga-drawer__body">{children}</div>
      {footer ? <div className="ga-drawer__foot">{footer}</div> : null}
    </aside>
  );
  if (mode === 'inline') return panel;
  return (
    <React.Fragment>
      <div className={cx('ga-scrim', mode === 'contained' && 'ga-scrim--contained')} onClick={onClose} />
      {panel}
    </React.Fragment>
  );
}
