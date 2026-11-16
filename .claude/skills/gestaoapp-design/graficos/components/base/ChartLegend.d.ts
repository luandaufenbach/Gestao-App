import * as React from 'react';
/** Legend for any chart. Pass onToggle to make items buttons that show/hide series (pair with the chart's hidden prop). */
export interface ChartLegendItem {
  key?: string;
  label: string;
  color: string;
  shape?: 'square' | 'dot' | 'line';
  /** Dashed line swatch — comparison/previous period/target */
  dashed?: boolean;
  value?: number;
  format?: string | ((v: number) => string);
}
export interface ChartLegendProps {
  items: ChartLegendItem[];
  /** Keys currently hidden */
  hidden?: string[];
  onToggle?: (key: string) => void;
  align?: 'start' | 'end';
  format?: string | ((v: number) => string);
  style?: React.CSSProperties;
}
export declare function ChartLegend(props: ChartLegendProps): JSX.Element;
