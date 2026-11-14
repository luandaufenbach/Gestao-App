import React from 'react';
import { Icon } from '../core/Icon.jsx';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function NavItem({ icon, dot, label, count, countBadge = false, active = false, href, onClick, className, style }) {
  const inner = (
    <React.Fragment>
      {icon ? <span className="ga-nav__icon"><Icon name={icon} size={17} /></span> : null}
      {dot ? <span className="ga-nav__dot" style={{ '--c': dot }} /> : null}
      <span className="ga-nav__label">{label}</span>
      {count != null ? <span className={cx('ga-nav__count', (countBadge || active) && 'ga-nav__count--badge')}>{count}</span> : null}
    </React.Fragment>
  );
  const cls = cx('ga-nav', active && 'ga-nav--active', className);
  if (href) return <a className={cls} href={href} onClick={onClick} style={style} aria-current={active ? 'page' : undefined} title={label}>{inner}</a>;
  return <button type="button" className={cls} onClick={onClick} style={style} aria-current={active ? 'page' : undefined} title={label}>{inner}</button>;
}
