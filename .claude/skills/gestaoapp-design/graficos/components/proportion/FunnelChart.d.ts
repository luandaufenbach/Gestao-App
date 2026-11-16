import * as React from 'react';
/** Sequential stages with drop-off: value, % of first stage and step conversion between rows. */
export interface FunnelChartProps {
  steps: { label: string; value: number; color?: string }[];
  format?: string | ((v: number) => string);
  labelWidth?: number;
  showConversion?: boolean;
  /** Override the cobalt ramp (dark → light) */
  colors?: string[];
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function FunnelChart(props: FunnelChartProps): JSX.Element;
