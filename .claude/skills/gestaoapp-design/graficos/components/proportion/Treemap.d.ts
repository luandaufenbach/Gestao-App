import * as React from 'react';
/** Squarified treemap — share of a total across many items (horas por projeto, orçamento por área). Labels hide when tiles are too small; tooltip via title. */
export interface TreemapProps {
  data: { label: string; value: number; color?: string; ink?: string }[];
  height?: number;
  format?: string | ((v: number) => string);
  gap?: number;
  showPercent?: boolean;
  onSelect?: (item: any) => void;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Treemap(props: TreemapProps): JSX.Element;
