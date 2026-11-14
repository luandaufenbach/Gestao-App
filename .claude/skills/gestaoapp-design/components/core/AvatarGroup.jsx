import React from 'react';
import { Avatar } from './Avatar.jsx';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }
const SIZES = { xs: 20, sm: 24, md: 28, lg: 32, xl: 40, '2xl': 48 };

export function AvatarGroup({ people = [], max = 4, size = 'md', className, style }) {
  const px = typeof size === 'number' ? size : (SIZES[size] || 28);
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <span className={cx('ga-avatar-group', className)} style={Object.assign({ '--s': px + 'px' }, style)}>
      {shown.map(function (p, i) { return <Avatar key={i} name={p.name} initials={p.initials} src={p.src} tone={p.tone} size={size} />; })}
      {extra > 0 ? <span className="ga-avatar ga-avatar--ink" style={{ '--s': px + 'px' }}>+{extra}</span> : null}
    </span>
  );
}
