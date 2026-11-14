import React from 'react';
import { Breadcrumb } from './Breadcrumb.jsx';

export function PageHeader({ breadcrumb, title, subtitle, actions, style }) {
  return (
    <header className="ga-phead" style={style}>
      <div className="ga-phead__text">
        {breadcrumb && breadcrumb.length ? <Breadcrumb items={breadcrumb} /> : null}
        <h1 className="ga-phead__title">{title}</h1>
        {subtitle ? <p className="ga-phead__sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ga-phead__actions">{actions}</div> : null}
    </header>
  );
}
