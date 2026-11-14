import * as React from 'react';
/** Mobile sheet sliding up from the bottom with grabber, title and text "Cancelar". */
export interface BottomSheetProps {
  open?: boolean;
  title?: React.ReactNode;
  closeLabel?: string;
  onClose?: () => void;
  /** Position absolutely inside the nearest positioned parent (device frames, previews) */
  contained?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function BottomSheet(props: BottomSheetProps): JSX.Element | null;
