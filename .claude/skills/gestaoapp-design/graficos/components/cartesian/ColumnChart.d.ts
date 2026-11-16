import * as React from 'react';
/** Vertical bars for comparing discrete periods/categories — single, grouped or stacked, with negative values, highlight (zest) and value labels. */
export interface ColumnChartProps {
  data: Record<string, any>[];
  xKey?: string;
  /** Default [{ key: 'value', label: 'Valor' }] */
  series?: { key: string; label: string; color?: string; format?: string | ((v: number) => string) }[];
  mode?: 'grouped' | 'stacked';
  height?: number;
  yFormat?: string | ((v: number) => string);
  xFormat?: (v: any, i: number) => string;
  /** Index or predicate — that column turns zest (e.g. "hoje", current month). Single series only. */
  highlight?: number | ((row: any, i: number) => boolean);
  /** Value (or stacked total) above each column */
  showValues?: boolean;
  hidden?: string[];
  references?: { value: number; label?: string; tone?: 'positive' | 'negative' }[];
  maxBarWidth?: number;
  radius?: number;
  tooltip?: boolean;
  /** Drill-down on column click */
  onSelect?: (row: any, i: number) => void;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function ColumnChart(props: ColumnChartProps): JSX.Element;
