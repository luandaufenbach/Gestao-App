import React from 'react';
import { IconButton } from '../core/IconButton.jsx';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function Sidebar({ brand = 'gestaoApp', collapsed = false, onToggle, header, footer, children, className, style }) {
  return (
    <aside className={cx('ga-sidebar', collapsed && 'ga-sidebar--collapsed', className)} style={style}>
      <div className="ga-sidebar__brand">
        <span className="ga-wordmark">{brand}</span>
        {onToggle ? <IconButton icon={collapsed ? 'chevron-right' : 'chevron-left'} label={collapsed ? 'Expandir menu' : 'Recolher menu'} size="sm" onClick={onToggle} /> : null}
      </div>
      {header || null}
      <nav className="ga-sidebar__body">{children}</nav>
      {footer ? <div className="ga-sidebar__foot">{footer}</div> : null}
    </aside>
  );
}
