import * as React from 'react';
/** Labeled single-line input with optional leading icon, trailing slot, hint and error. */
export interface TextFieldProps {
  label?: string;
  hint?: string;
  /** Error message — turns the border red */
  error?: string;
  /** Lucide icon name shown at the start */
  icon?: string;
  /** Node at the end of the field (Kbd, IconButton, unit) */
  trailing?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'sunken';
  type?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  name?: string;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}
export declare function TextField(props: TextFieldProps): JSX.Element;
