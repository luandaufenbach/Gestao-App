import * as React from 'react';
/** Solid-cobalt hero metric with zest icon tile and zest progress bar. Max one per screen. */
export interface GoalCardProps {
  label?: string;
  done?: number;
  total?: number;
  /** Zest helper text; defaults to "faltam N tarefas" */
  sub?: string;
  icon?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function GoalCard(props: GoalCardProps): JSX.Element;
