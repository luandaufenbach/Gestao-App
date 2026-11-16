import * as React from 'react';
/** How a starting value becomes an ending value through positive/negative steps (horas, orçamento, escopo). */
export interface WaterfallChartProps {
  /** total:true → full bar from 0 (start, subtotal, end). Others are deltas. */
  steps: { label: string; value?: number; total?: boolean }[];
  height?: number;
  yFormat?: string | ((v: number) => string);
  /** true when increases are bad (cost, hours over plan) */
  invert?: boolean;
  showValues?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function WaterfallChart(props: WaterfallChartProps): JSX.Element;
