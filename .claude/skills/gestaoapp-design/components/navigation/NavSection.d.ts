import * as React from 'react';
/** Group of NavItems with an uppercase micro label and optional action (e.g. + new project). */
export interface NavSectionProps {
  label?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function NavSection(props: NavSectionProps): JSX.Element;
