import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { IconButton } from '../core/IconButton.jsx';
import { Avatar } from '../core/Avatar.jsx';
import { ProjectTag } from '../core/ProjectTag.jsx';
import { PriorityFlag } from '../core/PriorityFlag.jsx';
import { Checkbox } from '../forms/Checkbox.jsx';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function TaskRow({ title, project, projectColor, time, late = false, priority, assignee, done = false, selected = false, layout = 'row', onToggle, onClick, onMore, className, style }) {
  const stacked = layout === 'stacked';
  return (
    <div className={cx('ga-task', stacked && 'ga-task--stacked', done && 'ga-task--done', selected && 'ga-task--selected', onClick && 'ga-task--clickable', className)} style={style} onClick={onClick}>
      <span onClick={function (e) { e.stopPropagation(); }} style={{ display: 'inline-flex' }}>
        <Checkbox shape="round" checked={done} onChange={function () { onToggle && onToggle(!done); }} ariaLabel={done ? 'Reabrir tarefa' : 'Concluir tarefa'} />
      </span>
      <div className="ga-task__main">
        <span className="ga-task__title">{title}</span>
        <span className="ga-task__meta">
          {project ? <ProjectTag name={project} color={projectColor} plain={stacked} /> : null}
          {time ? <span className={cx('ga-task__time', late && 'ga-task__time--late')}><Icon name={stacked ? 'clock' : 'calendar'} size={12} />{time}</span> : null}
          {priority ? <PriorityFlag level={priority} iconOnly={stacked} /> : null}
        </span>
      </div>
      <div className="ga-task__end">
        {assignee ? <Avatar name={assignee.name || assignee} tone={assignee.tone} size="sm" /> : null}
        {onMore && !stacked ? <IconButton icon="ellipsis" label="Mais ações" size="sm" onClick={function (e) { e.stopPropagation(); onMore(e); }} /> : null}
      </div>
    </div>
  );
}
