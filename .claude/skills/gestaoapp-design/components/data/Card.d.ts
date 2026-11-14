import * as React from 'react';
/**
 * Base surface: white, 1px hairline, radius 14, barely-there shadow. Optional header with title/subtitle/actions.
 * @startingPoint section="Data" subtitle="Card surfaces: default, brand, accent, inverse, dashed" viewport="700x1000"
 */
export interface CardProps {
  variant?: 'default' | 'sunken' | 'brand' | 'gradient' | 'accent' | 'inverse' | 'dashed';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Right-aligned header slot (IconButton, Badge, link) */
  actions?: React.ReactNode;
  interactive?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function Card(props: CardProps): JSX.Element;
