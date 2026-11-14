import * as React from 'react';
/** Flag icon + label tinted by priority (red high, orange medium, gray low). */
export interface PriorityFlagProps {
  level?: 'high' | 'medium' | 'low';
  /** Override pt-BR default (Alta · Média · Baixa) */
  label?: string;
  /** Flag only — used in compact/mobile rows */
  iconOnly?: boolean;
  style?: React.CSSProperties;
}
export declare function PriorityFlag(props: PriorityFlagProps): JSX.Element;
