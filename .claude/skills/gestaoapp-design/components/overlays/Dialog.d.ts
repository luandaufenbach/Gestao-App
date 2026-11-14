import * as React from 'react';
/** Centered confirm dialog for desktop destructive actions (intentional addition — mobile uses BottomSheet). */
export interface DialogProps {
  open?: boolean;
  tone?: 'default' | 'danger';
  icon?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  onClose?: () => void;
  contained?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Dialog(props: DialogProps): JSX.Element | null;
