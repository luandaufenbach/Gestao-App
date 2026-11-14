import * as React from 'react';
/** View switcher on a sunken track (Lista · Quadro · Calendário). */
export interface SegmentedControlProps {
  options: (string | { value: string; label: string; icon?: string })[];
  value?: string;
  onChange?: (value: string) => void;
  size?: 'sm' | 'md';
  /** Stretch items to fill the width (mobile) */
  block?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
export declare function SegmentedControl(props: SegmentedControlProps): JSX.Element;
