import * as React from 'react';
/** Rounded column chart: cobalt done over light planned track; today's bar in zest. */
export interface BarChartProps {
  data: { label: string; value: number; planned?: number; highlight?: boolean }[];
  max?: number;
  height?: number;
  legend?: boolean;
  legendLabels?: { done: string; today: string; planned: string };
  style?: React.CSSProperties;
}
export declare function BarChart(props: BarChartProps): JSX.Element;
