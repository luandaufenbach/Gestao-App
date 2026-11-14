import * as React from 'react';
/** Small pill for counts, states and labels. */
export interface BadgeProps {
  tone?: 'neutral' | 'brand' | 'brand-solid' | 'success' | 'warning' | 'danger' | 'accent' | 'inverse' | 'violet' | 'outline';
  size?: 'sm' | 'md';
  /** Leading dot in the current text color */
  dot?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;
