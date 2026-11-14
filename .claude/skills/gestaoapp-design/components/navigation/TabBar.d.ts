import * as React from 'react';
/**
 * Mobile bottom navigation with a centered cobalt "+" — always one thumb away.
 * @startingPoint section="Navigation" subtitle="Mobile tab bar with center add button" viewport="700x540"
 */
export interface TabBarProps {
  items: { value: string; label: string; icon: string }[];
  value?: string;
  onChange?: (value: string) => void;
  /** Renders the center FAB when provided */
  onAdd?: () => void;
  addLabel?: string;
  floating?: boolean;
  style?: React.CSSProperties;
}
export declare function TabBar(props: TabBarProps): JSX.Element;
