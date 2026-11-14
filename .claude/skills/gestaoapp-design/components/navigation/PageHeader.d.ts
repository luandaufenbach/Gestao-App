import * as React from 'react';
/** Page top: breadcrumb, title, one-line context, actions on the right. */
export interface PageHeaderProps {
  breadcrumb?: (string | { label: string; href?: string; onClick?: () => void })[];
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function PageHeader(props: PageHeaderProps): JSX.Element;
