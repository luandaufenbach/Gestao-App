import * as React from 'react';
/** One 100% bar split into segments + value legend. Compact part-to-whole for cards, rows and mobile. */
export interface DistributionBarProps {
  data: { label: string; value: number; color?: string }[];
  format?: string | ((v: number) => string);
  height?: number;
  legend?: boolean;
  showPercent?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function DistributionBar(props: DistributionBarProps): JSX.Element;
