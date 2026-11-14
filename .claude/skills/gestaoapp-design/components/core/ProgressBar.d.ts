import * as React from 'react';
/** Rounded progress track (project progress, weekly goal, workload). */
export interface ProgressBarProps {
  value?: number;
  max?: number;
  tone?: 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'violet' | 'lime' | 'neutral';
  /** Any CSS color — overrides tone (use a project color token) */
  color?: string;
  size?: 'xs' | 'sm' | 'md';
  /** Translucent white track for use on cobalt cards */
  onBrand?: boolean;
  label?: string;
  style?: React.CSSProperties;
}
export declare function ProgressBar(props: ProgressBarProps): JSX.Element;
