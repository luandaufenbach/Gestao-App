import React from 'react';
import { Icon } from '../core/Icon.jsx';

export function WorkspaceSwitcher({ name, eyebrow = 'Workspace da equipe', initial, onClick, style }) {
  return (
    <button type="button" className="ga-ws" onClick={onClick} style={style} title={name}>
      <span className="ga-ws__logo">{initial || (name ? name[0] : 'W')}</span>
      <span className="ga-ws__meta">
        <span className="ga-ws__eyebrow">{eyebrow}</span>
        <span className="ga-ws__name">{name}</span>
      </span>
      <span className="ga-ws__chev"><Icon name="chevron-down" size={15} /></span>
    </button>
  );
}
