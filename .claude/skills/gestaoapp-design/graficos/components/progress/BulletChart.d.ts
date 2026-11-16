import * as React from 'react';
/** Actual vs target per row, over optional qualitative bands — planned × realized hours, budget, OKRs. */
export interface BulletChartProps {
  rows: { label: string; sub?: string; value: number; target?: number; ranges?: number[]; color?: string }[];
  format?: string | ((v: number) => string);
  max?: number;
  labelWidth?: number;
  /** Fixed value column so lanes align (px) */
  valueWidth?: number;
  color?: string;
  /** Color when value exceeds target and overIsBad */
  overColor?: string;
  /** Over target turns red (hours, cost) */
  overIsBad?: boolean;
  showScale?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function BulletChart(props: BulletChartProps): JSX.Element;
