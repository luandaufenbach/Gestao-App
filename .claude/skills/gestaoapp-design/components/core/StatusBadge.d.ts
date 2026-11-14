import * as React from 'react';
/** Workflow state of a task: dot + label on a tinted pill. */
export interface StatusBadgeProps {
  status?: 'todo' | 'progress' | 'review' | 'done';
  /** Override the default pt-BR label (A fazer · Em andamento · Em revisão · Concluída) */
  label?: string;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}
export declare function StatusBadge(props: StatusBadgeProps): JSX.Element;
