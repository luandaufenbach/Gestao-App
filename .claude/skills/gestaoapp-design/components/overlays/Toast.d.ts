import * as React from 'react';
/** Floating notification card. success = zest check circle + green line ("Concluída agora"). */
export interface ToastProps {
  tone?: 'success' | 'info' | 'danger' | 'brand';
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: string;
  /** Trailing action, e.g. <Button size="sm">Entrar</Button> */
  action?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Toast(props: ToastProps): JSX.Element;
