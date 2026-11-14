import * as React from 'react';
/** Pill filter. Inactive shows a chevron; active turns cobalt-tinted with a remove ×. */
export interface FilterChipProps {
  label: string;
  icon?: string;
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onRemove?: () => void;
  /** Show chevron when inactive */
  dropdown?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  style?: React.CSSProperties;
}
export declare function FilterChip(props: FilterChipProps): JSX.Element;
