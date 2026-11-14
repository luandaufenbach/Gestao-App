import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { ProgressBar } from '../core/ProgressBar.jsx';

export function GoalCard({ label = 'Meta semanal', done = 24, total = 28, sub, icon = 'target', className, style }) {
  const pct = Math.round((done / (total || 1)) * 100);
  const left = Math.max(0, total - done);
  return (
    <div className={'ga-card ga-card--brand ga-goal' + (className ? ' ' + className : '')} style={style}>
      <div className="ga-goal__head">
        <span className="ga-goal__icon"><Icon name={icon} size={15} strokeWidth={2.25} /></span>
        <span className="ga-goal__label">{label}</span>
        <span className="ga-goal__count">{done} / {total}</span>
      </div>
      <div className="ga-goal__row">
        <span className="ga-goal__value">{pct}%</span>
        <span className="ga-goal__sub">{sub || ('faltam ' + left + ' tarefas')}</span>
      </div>
      <ProgressBar value={pct} tone="accent" onBrand size="sm" label={label} />
    </div>
  );
}
