import React from 'react';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

const SIZES = { xs: 20, sm: 24, md: 28, lg: 32, xl: 40, '2xl': 48 };
const TONES = ['cobalt', 'zest', 'violet', 'orange', 'sky', 'green'];

function initialsOf(name) {
  if (!name) return '';
  const p = String(name).trim().split(/\s+/);
  return ((p[0] || '')[0] + ((p.length > 1 ? p[p.length - 1] : '')[0] || '')).toUpperCase();
}
function toneFor(name) {
  let h = 0; const s = String(name || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

export function Avatar({ name, initials, src, tone, size = 'md', status, className, style }) {
  const px = typeof size === 'number' ? size : (SIZES[size] || 28);
  const t = tone || toneFor(name);
  return (
    <span className={cx('ga-avatar', 'ga-avatar--' + t, className)} style={Object.assign({ '--s': px + 'px' }, style)} title={name}>
      {src ? <img src={src} alt={name || ''} /> : (initials || initialsOf(name))}
      {status ? <span className={cx('ga-avatar__status', status !== 'online' && 'ga-avatar__status--' + status)} /> : null}
    </span>
  );
}
