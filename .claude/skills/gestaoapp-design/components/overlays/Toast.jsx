import React from 'react';
import { Icon } from '../core/Icon.jsx';

const ICON = { success: 'check', info: 'bell', danger: 'triangle-alert', brand: 'bell' };

export function Toast({ tone = 'success', title, description, icon, action, style }) {
  return (
    <div role="status" className={'ga-toast ga-toast--' + tone} style={style}>
      <span className="ga-toast__icon"><Icon name={icon || ICON[tone]} size={16} strokeWidth={2.25} /></span>
      <span className="ga-toast__text">
        <span className="ga-toast__title">{title}</span>
        {description ? <span className="ga-toast__desc">{description}</span> : null}
      </span>
      {action || null}
    </div>
  );
}
