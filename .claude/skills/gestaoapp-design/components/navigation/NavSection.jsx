import React from 'react';

export function NavSection({ label, action, children, style }) {
  return (
    <div className="ga-navsec" style={style}>
      {label ? <div className="ga-navsec__head"><span>{label}</span>{action || null}</div> : null}
      {children}
    </div>
  );
}
