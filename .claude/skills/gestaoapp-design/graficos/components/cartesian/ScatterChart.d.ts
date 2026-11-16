import * as React from 'react';
/** Relationship between two measures (esforço × impacto). Optional bubble size, groups and quadrant guides. */
export interface ScatterChartProps {
  points: { x: number; y: number; size?: number; label?: string; group?: string; color?: string }[];
  groups?: { key: string; label: string; color?: string }[];
  height?: number;
  xFormat?: string | ((v: number) => string);
  yFormat?: string | ((v: number) => string);
  xLabel?: string;
  yLabel?: string;
  /** Radius range for bubbles (px) */
  sizeRange?: [number, number];
  bubble?: boolean;
  /** Dashed guides + corner labels [topLeft, topRight, bottomLeft, bottomRight] */
  quadrants?: { x: number; y: number; labels?: string[] };
  hidden?: string[];
  onSelect?: (point: any) => void;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function ScatterChart(props: ScatterChartProps): JSX.Element;
