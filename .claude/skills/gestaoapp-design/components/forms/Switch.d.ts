import * as React from 'react';
/** On/off toggle — cobalt track when on. */
export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: React.ReactNode;
  size?: 'sm' | 'md';
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Switch(props: SwitchProps): JSX.Element;
