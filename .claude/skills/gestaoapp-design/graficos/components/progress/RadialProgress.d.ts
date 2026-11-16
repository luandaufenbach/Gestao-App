import * as React from 'react';
/** Circular progress — one ring with center %, or up to 3 concentric rings (metas pessoais) with a legend. */
export interface RadialProgressProps {
  rings: { label: string; value: number; max?: number; color?: string; sub?: string; display?: string }[];
  size?: number;
  thickness?: number;
  gap?: number;
  centerValue?: React.ReactNode;
  centerLabel?: string;
  legend?: boolean;
  format?: string;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function RadialProgress(props: RadialProgressProps): JSX.Element;
