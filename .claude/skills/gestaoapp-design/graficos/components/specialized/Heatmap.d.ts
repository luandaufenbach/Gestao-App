import * as React from 'react';
/** Matrix of intensity in the cobalt sequential scale — day × hour activity, calendar of completions (rows = weekdays, cols = weeks). Cells resize to fit; scrolls when too narrow. */
export interface HeatmapProps {
  rows: string[];
  cols: string[];
  /** values[row][col] */
  values: (number | null)[][];
  format?: string | ((v: number) => string);
  max?: number;
  cellGap?: number;
  radius?: number;
  maxCell?: number;
  minCell?: number;
  /** Show every Nth column label (auto by cell size) */
  colLabelEvery?: number;
  legend?: boolean;
  legendLabels?: [string, string];
  colors?: string[];
  emptyColor?: string;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Heatmap(props: HeatmapProps): JSX.Element;
