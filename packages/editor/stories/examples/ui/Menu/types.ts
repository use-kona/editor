import type { ReactNode } from 'react';

export type MenuConfig = {
  items?: MenuItem[];
  header?: () => ReactNode;
  footer?: () => ReactNode;
  onOpen?: () => void;
  onFocus?: () => void;
}

export type MenuItem = {
  render: () => ReactNode;
  selectable?: boolean;
  autoClose?: boolean;
  config?: MenuConfig;
  danger?: boolean;
  onSelect?: () => void;
}
