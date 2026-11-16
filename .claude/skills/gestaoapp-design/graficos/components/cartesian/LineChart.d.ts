import * as React from 'react';
/**
 * Trend over time. Smooth monotone lines, crosshair tooltip, dashed comparison series, reference/target lines, optional area and stacking.
 * @startingPoint section="Gráficos" subtitle="Line & area charts with crosshair tooltip" viewport="700x700"
 */
export interface ChartSeries {
  key: string;
  label: string;
  /** Defaults to var(--chart-N) by position */
  color?: string;
  /** Dashed, never filled or stacked — previous period, forecast, ideal line */
  dashed?: boolean;
  /** Fill this series only */
  area?: boolean;
  format?: string | ((v: number) => string);
}
export interface LineChartProps {
  data: Record<string, any>[];
  /** Field for x labels (default "label") */
  xKey?: string;
  series: ChartSeries[];
  height?: number;
  /** 'number' | 'compact' | 'percent' | 'pp' | 'hours' | 'days' | 'currency' | 'currencyCompact' | fn */
  yFormat?: string | ((v: number) => string);
  xFormat?: (v: any, i: number) => string;
  yDomain?: [number, number];
  curve?: 'smooth' | 'linear' | 'step';
  area?: boolean;
  stacked?: boolean;
  dots?: 'hover' | 'always';
  references?: { value: number; label?: string; tone?: 'positive' | 'negative' }[];
  /** Series keys hidden via ChartLegend */
  hidden?: string[];
  /** Pulse on the latest point of the first solid series ("hoje") */
  highlightLast?: boolean;
  tooltip?: boolean;
  tooltipTitle?: (row: any, i: number) => React.ReactNode;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function LineChart(props: LineChartProps): JSX.Element;
