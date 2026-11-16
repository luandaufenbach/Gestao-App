import * as React from 'react';
/** Ranking / comparison of named items with long labels (membros, projetos, clientes). HTML-based, sorts desc, optional rank, target tick, prefix (avatar). */
export interface HBarChartProps {
  data: { label: string; value: number; sub?: string; color?: string; prefix?: React.ReactNode; target?: number }[];
  format?: string | ((v: number) => string);
  max?: number;
  color?: string;
  sort?: boolean;
  showRank?: boolean;
  /** Top item in zest */
  highlightFirst?: boolean;
  labelWidth?: number;
  /** Fixed value column so tracks align (px) */
  valueWidth?: number;
  barHeight?: number;
  /** Same target for every row (vertical ink tick) */
  target?: number;
  /** Show top N */
  limit?: number;
  onSelect?: (row: any) => void;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function HBarChart(props: HBarChartProps): JSX.Element;
