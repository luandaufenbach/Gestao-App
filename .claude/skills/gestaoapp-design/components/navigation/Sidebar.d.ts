import * as React from 'react';
/**
 * Desktop app shell sidebar: wordmark + collapse, header slot (workspace, search), nav body, footer slot (promo, user).
 * @startingPoint section="Navigation" subtitle="App sidebar with workspace switcher, nav and projects" viewport="700x540"
 */
export interface SidebarProps {
  /** Wordmark text (no logo file exists — brand renders in type) */
  brand?: string;
  collapsed?: boolean;
  onToggle?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Sidebar(props: SidebarProps): JSX.Element;
