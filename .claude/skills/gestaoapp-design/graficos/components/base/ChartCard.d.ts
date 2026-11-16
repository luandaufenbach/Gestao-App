import * as React from 'react';
/**
 * Container for every chart: title, subtitle, actions (period), headline value + delta, legend, chart body, footer (source · updated) and loading/empty/error states.
 * @startingPoint section="Gráficos" subtitle="Chart card with KPI, legend and states" viewport="700x620"
 */
export interface ChartCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Right side of header: period SegmentedControl, export button, menu */
  actions?: React.ReactNode;
  /** Headline number shown above the chart */
  value?: React.ReactNode | number;
  valueFormat?: string | ((v: number) => string);
  delta?: number;
  deltaFormat?: string;
  /** true when lower is better */
  deltaInvert?: boolean;
  /** e.g. "vs 30 dias anteriores" */
  comparison?: string;
  legend?: { key?: string; label: string; color: string; shape?: 'square' | 'dot' | 'line'; dashed?: boolean; value?: number }[];
  hidden?: string[];
  onToggleLegend?: (key: string) => void;
  /** e.g. "Fonte: tarefas · atualizado há 5 min" */
  footer?: React.ReactNode;
  state?: 'ready' | 'loading' | 'empty' | 'error';
  /** Height reserved for loading/empty/error states (match the chart) */
  height?: number;
  emptyTitle?: string;
  emptyText?: string;
  errorText?: string;
  onRetry?: () => void;
  /** Chart body runs edge-to-edge (tables, gantt) */
  flush?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function ChartCard(props: ChartCardProps): JSX.Element;
