import * as React from 'react';
/** KPI tile: tinted icon, label, big number, optional delta/caption. */
export interface StatCardProps {
  icon?: string;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'accent' | 'violet';
  label: string;
  value: React.ReactNode;
  /** e.g. "18% vs semana passada" or "1 atrasada" */
  delta?: string;
  /** up = green with arrow; down = red */
  deltaTrend?: 'up' | 'down';
  /** Neutral gray helper text, e.g. "em 4 projetos" */
  caption?: string;
  onMore?: () => void;
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
export declare function StatCard(props: StatCardProps): JSX.Element;
