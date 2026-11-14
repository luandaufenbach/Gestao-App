import * as React from 'react';
/** Square/circle icon-only button (bell, more, filter, close, FAB). */
export interface IconButtonProps {
  /** Lucide icon name */
  icon: string;
  /** Accessible label (also used as tooltip) */
  label: string;
  variant?: 'ghost' | 'outline' | 'soft' | 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  shape?: 'rounded' | 'circle';
  /** Red notification dot */
  dot?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
