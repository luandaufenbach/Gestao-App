import * as React from 'react';
/** Sidebar link: icon (or project color dot), label, count. Active = white raised pill with cobalt icon. */
export interface NavItemProps {
  icon?: string;
  /** Project color — renders a rounded square instead of an icon */
  dot?: string;
  label: string;
  count?: number | string;
  /** Force cobalt count pill (auto when active) */
  countBadge?: boolean;
  active?: boolean;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}
export declare function NavItem(props: NavItemProps): JSX.Element;
