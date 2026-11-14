import * as React from 'react';
/** Native select styled like TextField (role pickers, time zone). */
export interface SelectProps {
  label?: string;
  hint?: string;
  icon?: string;
  options: (string | { value: string; label: string })[];
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Select(props: SelectProps): JSX.Element;
