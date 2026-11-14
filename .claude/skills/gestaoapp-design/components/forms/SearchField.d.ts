import * as React from 'react';
/** Search input with magnifier and optional ⌘K hint. */
export interface SearchFieldProps {
  placeholder?: string;
  /** Shortcut hint; pass null to hide (always hide on mobile) */
  shortcut?: string | null;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  variant?: 'default' | 'sunken';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}
export declare function SearchField(props: SearchFieldProps): JSX.Element;
