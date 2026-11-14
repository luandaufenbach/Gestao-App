import React from 'react';
import { Icon } from './Icon.jsx';

// gestaoApp Button — pill-shaped, Outfit medium. Primary carries the cobalt glow.
function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function Button({ variant = 'primary', size = 'md', icon, iconRight, block = false, disabled = false, type = 'button', href, onClick, className, style, children, ...rest }) {
  const cls = cx('ga-btn', 'ga-btn--' + variant, size !== 'md' && 'ga-btn--' + size, block && 'ga-btn--block', className);
  const isz = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  const content = (
    <React.Fragment>
      {icon ? <Icon name={icon} size={isz} strokeWidth={2} /> : null}
      {children != null ? <span>{children}</span> : null}
      {iconRight ? <Icon name={iconRight} size={isz} strokeWidth={2} /> : null}
    </React.Fragment>
  );
  if (href) return <a className={cls} href={href} style={style} onClick={onClick} {...rest}>{content}</a>;
  return <button type={type} className={cls} disabled={disabled} onClick={onClick} style={style} {...rest}>{content}</button>;
}
