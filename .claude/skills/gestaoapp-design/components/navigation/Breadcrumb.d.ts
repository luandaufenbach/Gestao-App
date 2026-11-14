import * as React from 'react';
/** Small gray trail above page titles: Workspace › Page. */
export interface BreadcrumbProps {
  items: (string | { label: string; href?: string; onClick?: () => void })[];
  style?: React.CSSProperties;
}
export declare function Breadcrumb(props: BreadcrumbProps): JSX.Element;
