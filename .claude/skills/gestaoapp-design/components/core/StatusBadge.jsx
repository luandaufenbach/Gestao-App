import React from 'react';

const STATUS = {
  todo: { label: 'A fazer', dot: 'var(--status-todo)', bg: 'var(--status-todo-bg)' },
  progress: { label: 'Em andamento', dot: 'var(--status-progress)', bg: 'var(--status-progress-bg)' },
  review: { label: 'Em revisão', dot: 'var(--status-review)', bg: 'var(--status-review-bg)' },
  done: { label: 'Concluída', dot: 'var(--status-done)', bg: 'var(--status-done-bg)' }
};

export function StatusBadge({ status = 'todo', label, size = 'md', style }) {
  const s = STATUS[status] || STATUS.todo;
  return (
    <span className={'ga-badge ga-status' + (size === 'sm' ? ' ga-badge--sm' : '')} style={Object.assign({ '--sd': s.dot, '--sb': s.bg }, style)}>
      <span className="ga-badge__dot" />
      {label || s.label}
    </span>
  );
}
