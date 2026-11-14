import * as React from 'react';
/** Checkbox. shape="round" is the task-completion circle used in every task row. */
export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: React.ReactNode;
  description?: string;
  shape?: 'square' | 'round';
  size?: 'md' | 'lg';
  /** Strike-through + gray label when checked (subtask checklists) */
  strike?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
