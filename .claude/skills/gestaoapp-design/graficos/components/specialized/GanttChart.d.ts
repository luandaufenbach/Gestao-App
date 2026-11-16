import * as React from 'react';
/**
 * Project timeline: rows with date bars (progress fill), milestones (diamond), weekly grid and a "Hoje" marker. Sticky label column; scrolls horizontally on small screens.
 * @startingPoint section="Gráficos" subtitle="Gantt / cronograma de projetos" viewport="700x620"
 */
export interface GanttChartProps {
  /** ISO date YYYY-MM-DD */
  start: string;
  end: string;
  rows: { label: string; sub?: string; start: string; end?: string; progress?: number; color?: string; milestone?: boolean }[];
  today?: string;
  labelWidth?: number;
  rowHeight?: number;
  /** Grid/label interval in days (7 = weekly) */
  tickDays?: number;
  /** Below this width the timeline scrolls */
  minWidth?: number;
  onSelect?: (row: any) => void;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function GanttChart(props: GanttChartProps): JSX.Element;
