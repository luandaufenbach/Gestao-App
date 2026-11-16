import * as React from 'react';
/** Semicircle gauge for one value against a scale: optional target tick and colored zones (ruim/atenção/bom). */
export interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  target?: number;
  label?: string;
  format?: string | ((v: number) => string);
  /** Ascending thresholds; value arc takes the color of its zone */
  zones?: { to: number; color: string; label?: string }[];
  size?: number;
  thickness?: number;
  color?: string;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function GaugeChart(props: GaugeChartProps): JSX.Element;
