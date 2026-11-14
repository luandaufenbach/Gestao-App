import React from 'react';
import { Icon } from '../core/Icon.jsx';

export function Breadcrumb({ items = [], style }) {
  return (
    <nav aria-label="Breadcrumb" className="ga-crumbs" style={style}>
      {items.map(function (it, i) {
        const last = i === items.length - 1;
        const label = typeof it === 'string' ? it : it.label;
        return (
          <React.Fragment key={i}>
            {last ? <span className="ga-crumbs__current" aria-current="page">{label}</span>
              : it.onClick ? <button type="button" onClick={it.onClick}>{label}</button>
              : it.href ? <a href={it.href}>{label}</a> : <span>{label}</span>}
            {!last ? <Icon name="chevron-right" size={12} /> : null}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
