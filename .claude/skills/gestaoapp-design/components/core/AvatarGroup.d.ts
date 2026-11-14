import * as React from 'react';
/** Overlapping avatar stack with a dark "+N" overflow chip. */
export interface AvatarGroupProps {
  people: { name?: string; initials?: string; src?: string; tone?: 'cobalt' | 'zest' | 'violet' | 'orange' | 'sky' | 'green' | 'ink' }[];
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  className?: string;
  style?: React.CSSProperties;
}
export declare function AvatarGroup(props: AvatarGroupProps): JSX.Element;
