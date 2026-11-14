import * as React from 'react';
/**
 * The atomic unit of gestaoApp: round check, title, project, time, priority, assignee.
 * @startingPoint section="Data" subtitle="Task row — desktop row and mobile stacked layouts" viewport="700x1000"
 */
export interface TaskRowProps {
  title: string;
  project?: string;
  /** var(--project-N) */
  projectColor?: string;
  /** Pre-formatted, e.g. "10:00" or "qui, 9 out" */
  time?: string;
  /** Red time when overdue */
  late?: boolean;
  priority?: 'high' | 'medium' | 'low';
  assignee?: string | { name: string; tone?: 'cobalt' | 'zest' | 'violet' | 'orange' | 'sky' | 'green' | 'ink' };
  done?: boolean;
  selected?: boolean;
  /** row = single line (desktop); stacked = title over meta (mobile, narrow panels) */
  layout?: 'row' | 'stacked';
  onToggle?: (done: boolean) => void;
  onClick?: (e: React.MouseEvent) => void;
  onMore?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}
export declare function TaskRow(props: TaskRowProps): JSX.Element;
