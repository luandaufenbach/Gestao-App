import * as React from 'react';
/** Project overview tile: icon, health badge, description, progress, members, counts. */
export interface ProjectCardProps {
  name: string;
  description?: string;
  icon?: string;
  /** Project color, var(--project-N) */
  color?: string;
  /** Icon tile background; defaults to 14% of color */
  tint?: string;
  health?: 'ontrack' | 'atrisk' | 'late' | 'done';
  progress?: number;
  tasksDone?: number;
  tasksTotal?: number;
  due?: string;
  members?: { name: string; tone?: string }[];
  onClick?: (e: React.MouseEvent) => void;
  onMore?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}
export declare function ProjectCard(props: ProjectCardProps): JSX.Element;
