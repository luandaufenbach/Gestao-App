import * as React from 'react';
/** Part-to-whole for 2–6 categories: donut (default) or pie, center total that swaps to the hovered slice, legend list with value + %. */
export interface DonutChartProps {
  data: { label: string; value: number; color?: string }[];
  size?: number;
  thickness?: number;
  variant?: 'donut' | 'pie';
  centerLabel?: string;
  centerValue?: React.ReactNode;
  format?: string | ((v: number) => string);
  /** right collapses to bottom under 400px card width */
  legend?: 'right' | 'bottom' | 'none';
  showPercent?: boolean;
  /** Gap between slices in px */
  gap?: number;
  onSelect?: (item: any) => void;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function DonutChart(props: DonutChartProps): JSX.Element;
