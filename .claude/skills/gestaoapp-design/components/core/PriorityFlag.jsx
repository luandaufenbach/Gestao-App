import React from 'react';
import { Icon } from './Icon.jsx';

const LABELS = { high: 'Alta', medium: 'Média', low: 'Baixa' };

export function PriorityFlag({ level = 'low', label, iconOnly = false, style }) {
  return (
    <span className={'ga-prio ga-prio--' + level} style={style} title={'Prioridade ' + (label || LABELS[level])}>
      <Icon name="flag" size={13} strokeWidth={2} />
      {iconOnly ? null : <span>{label || LABELS[level]}</span>}
    </span>
  );
}
