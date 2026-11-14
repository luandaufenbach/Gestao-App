import * as React from 'react';
/** Lightweight table: uppercase micro headers on a sunken strip, hairline rows, hover tint. Scrolls horizontally on small screens. */
export interface DataTableColumn {
  key: string;
  header: React.ReactNode;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  render?: (row: any) => React.ReactNode;
}
export interface DataTableProps {
  columns: DataTableColumn[];
  rows: any[];
  rowKey?: string;
  onRowClick?: (row: any) => void;
  compact?: boolean;
  style?: React.CSSProperties;
}
export declare function DataTable(props: DataTableProps): JSX.Element;
