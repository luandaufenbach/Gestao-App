import * as React from 'react';
/** Underline tabs with optional count chips (Todos 5 · Ativos 4 · Concluídos 1 · Arquivados). */
export interface TabsProps {
  tabs: (string | { value: string; label: string; count?: number })[];
  value?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}
export declare function Tabs(props: TabsProps): JSX.Element;
