import * as React from 'react';
/** Single-choice radio — cobalt fill with white center. */
export interface RadioProps {
  name?: string;
  value?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Radio(props: RadioProps): JSX.Element;
