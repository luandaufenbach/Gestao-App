import * as React from 'react';
/** Lucide outline icon (copied path data). 24px grid, round caps/joins. */
export interface IconProps {
  /** Lucide icon name, e.g. "layout-grid", "square-check", "folder", "calendar", "users", "settings", "bell", "search", "flag", "plus" */
  name: string;
  size?: number;
  /** 1.75 default; 2–2.25 inside buttons */
  strokeWidth?: number;
  color?: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element | null;
export declare const ICON_NAMES: string[];
