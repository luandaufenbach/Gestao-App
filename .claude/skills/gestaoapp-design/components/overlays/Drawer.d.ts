import * as React from 'react';
/** Right-side detail panel (task details). inline = sits in the page grid; overlay = fixed with scrim; contained = absolute within parent. */
export interface DrawerProps {
  open?: boolean;
  mode?: 'overlay' | 'inline' | 'contained';
  title?: React.ReactNode;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Drawer(props: DrawerProps): JSX.Element | null;
