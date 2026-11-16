import * as React from 'react';
/** Bars (volume, left axis) + line (rate, right axis) on one time axis — e.g. entregas × % no prazo. */
export interface ComboChartProps {
  data: Record<string, any>[];
  xKey?: string;
  bar: { key: string; label: string; color?: string; format?: string | ((v: number) => string) };
  line: { key: string; label: string; color?: string; format?: string | ((v: number) => string) };
  height?: number;
  /** Left axis (bars) */
  yFormat?: string | ((v: number) => string);
  /** Right axis (line). Default 'percent' */
  y2Format?: string | ((v: number) => string);
  y2Domain?: [number, number];
  highlight?: number | ((row: any, i: number) => boolean);
  hidden?: string[];
  tooltip?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function ComboChart(props: ComboChartProps): JSX.Element;
