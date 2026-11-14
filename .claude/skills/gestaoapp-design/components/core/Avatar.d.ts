import * as React from 'react';
/** Initials (or photo) avatar on a soft brand tint. Tone is derived from the name when omitted. */
export interface AvatarProps {
  name?: string;
  initials?: string;
  src?: string;
  tone?: 'cobalt' | 'zest' | 'violet' | 'orange' | 'sky' | 'green' | 'ink' | 'brand';
  /** xs 20 · sm 24 · md 28 · lg 32 · xl 40 · 2xl 48, or a pixel number */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  status?: 'online' | 'away' | 'offline';
  className?: string;
  style?: React.CSSProperties;
}
export declare function Avatar(props: AvatarProps): JSX.Element;
