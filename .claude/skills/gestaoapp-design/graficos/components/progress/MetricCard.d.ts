import * as React from 'react';
/**
 * KPI tile for reports: label, big number (+unit), TrendDelta, sparkline of the period, comparison caption. brand = solid cobalt hero (one per screen).
 * @startingPoint section="Gráficos" subtitle="KPI cards with sparkline and delta" viewport="700x560"
 */
export interface MetricCardProps {
  label: string;
  value: React.ReactNode | number;
  /** Small suffix after the number, e.g. "dias", "h" */
  unit?: string;
  format?: string | ((v: number) => string);
  delta?: number;
  deltaFormat?: 'percent' | 'pp' | 'number' | 'hours' | 'days';
  /** Lower is better */
  invert?: boolean;
  comparison?: string;
  spark?: number[];
  sparkVariant?: 'line' | 'area' | 'bar';
  sparkColor?: string;
  /** Icon node (e.g. <Icon name="zap" size={15} />) in a tinted tile */
  icon?: React.ReactNode;
  variant?: 'default' | 'brand';
  compact?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  footer?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export declare function MetricCard(props: MetricCardProps): JSX.Element;
