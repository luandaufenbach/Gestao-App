import * as React from 'react';
/** Variation indicator: arrow + signed value, green when it improves and red when it worsens. */
export interface TrendDeltaProps {
  /** Signed change, e.g. 12.4 (= +12,4%) or -3 */
  value: number;
  /** percent → "+12,4%" · pp → "+3,1 pp" · number · hours · days · currency, or a function */
  format?: 'percent' | 'pp' | 'number' | 'hours' | 'days' | 'currency' | 'compact' | ((v: number) => string);
  /** true when lower is better (cycle time, overdue tasks, cost) */
  invert?: boolean;
  variant?: 'pill' | 'text';
  size?: 'sm' | 'md';
  /** White variant for cobalt cards */
  onBrand?: boolean;
  /** Screen-reader context, e.g. "vs mês anterior" */
  label?: string;
  style?: React.CSSProperties;
}
export declare function TrendDelta(props: TrendDeltaProps): JSX.Element;
