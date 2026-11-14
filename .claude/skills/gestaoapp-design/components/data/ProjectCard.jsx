import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { Badge } from '../core/Badge.jsx';
import { AvatarGroup } from '../core/AvatarGroup.jsx';
import { ProgressBar } from '../core/ProgressBar.jsx';
import { IconButton } from '../core/IconButton.jsx';

const HEALTH = { ontrack: ['success', 'No prazo'], atrisk: ['warning', 'Em risco'], late: ['danger', 'Atrasado'], done: ['neutral', 'Concluído'] };

export function ProjectCard({ name, description, icon = 'layers', color = 'var(--project-1)', tint, health = 'ontrack', progress = 0, tasksDone, tasksTotal, due, members = [], onClick, onMore, className, style }) {
  const h = HEALTH[health] || HEALTH.ontrack;
  return (
    <div className={'ga-card ga-pcard' + (onClick ? ' ga-card--interactive' : '') + (className ? ' ' + className : '')} style={style} onClick={onClick}>
      <div className="ga-pcard__top">
        <span className="ga-pcard__icon" style={{ '--t-bg': tint || 'color-mix(in oklab, ' + color + ' 14%, transparent)', '--t-fg': color }}><Icon name={icon} size={17} /></span>
        <span className="ga-pcard__top-end">
          <Badge tone={h[0]} size="sm">{h[1]}</Badge>
          {onMore ? <IconButton icon="ellipsis" label="Mais" size="sm" onClick={function (e) { e.stopPropagation(); onMore(e); }} /> : null}
        </span>
      </div>
      <div>
        <div className="ga-pcard__name">{name}</div>
        {description ? <div className="ga-pcard__desc">{description}</div> : null}
      </div>
      <div className="ga-pcard__prog">
        <div className="ga-pcard__prog-row"><span>Progresso</span><b>{progress}%</b></div>
        <ProgressBar value={progress} color={color} size="xs" />
      </div>
      <div className="ga-pcard__foot">
        <AvatarGroup people={members} size="xs" max={3} />
        <span className="ga-pcard__facts">
          {tasksTotal != null ? <span className="ga-pcard__fact"><Icon name="square-check" size={13} />{tasksDone}/{tasksTotal}</span> : null}
          {due ? <span className="ga-pcard__fact"><Icon name="calendar" size={13} />{due}</span> : null}
        </span>
      </div>
    </div>
  );
}
