import * as React from 'react';
/** Workspace picker button: zest initial tile + eyebrow + name + chevron. */
export interface WorkspaceSwitcherProps {
  name: string;
  eyebrow?: string;
  initial?: string;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}
export declare function WorkspaceSwitcher(props: WorkspaceSwitcherProps): JSX.Element;
