import * as React from 'react';
/** Word-sized trend line/area/bars without axes — inside KPI cards, table cells and list rows. */
export interface SparklineProps {
  data: (number | { value: number })[];
  /** Fixed px width; omit to fill the container */
  width?: number;
  height?: number;
  variant?: 'line' | 'area' | 'bar';
  color?: string;
  /** Green/red by first→last direction */
  trendColor?: boolean;
  /** With trendColor: down is good */
  invert?: boolean;
  showEnd?: boolean;
  /** Bar variant: last bar full opacity */
  highlightLast?: boolean;
  strokeWidth?: number;
  ariaLabel?: string;
  style?: React.CSSProperties;
}
export declare function Sparkline(props: SparklineProps): JSX.Element;
