import * as React from 'react';
/**
 * Pill button used for every action in gestaoApp.
 * @startingPoint section="Core" subtitle="Primary, secondary, accent, dark, ghost, danger buttons" viewport="700x470"
 */
export interface ButtonProps {
  /** primary = cobalt + glow (one per view); secondary = white outline; accent = zest "complete/done"; dark = ink CTA; ghost = quiet; danger = destructive; glass = on sky imagery */
  variant?: 'primary' | 'secondary' | 'accent' | 'dark' | 'ghost' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  /** Lucide icon name rendered before the label (see Icon ICON_NAMES) */
  icon?: string;
  iconRight?: string;
  block?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;
