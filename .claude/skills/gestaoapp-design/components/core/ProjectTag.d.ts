import * as React from 'react';
/** Project reference: colored square + project name, on a sunken chip. */
export interface ProjectTagProps {
  name: string;
  /** CSS color, normally var(--project-1…7) */
  color?: string;
  /** No chip background — just square + label */
  plain?: boolean;
  style?: React.CSSProperties;
}
export declare function ProjectTag(props: ProjectTagProps): JSX.Element;
