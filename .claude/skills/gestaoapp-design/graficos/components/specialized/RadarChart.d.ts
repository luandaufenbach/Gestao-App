import * as React from 'react';
/** Profile across 5–8 dimensions for 1–2 series (sprint atual vs anterior, perfil de carga). */
export interface RadarChartProps {
  axes: string[];
  /** values align with axes. dashed = comparison profile */
  series: { key?: string; label: string; values: number[]; color?: string; dashed?: boolean }[];
  max?: number;
  levels?: number;
  height?: number;
  format?: string | ((v: number) => string);
  hidden?: string[];
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function RadarChart(props: RadarChartProps): JSX.Element;
