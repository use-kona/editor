import type { ReactNode } from 'react';
import type { Editor } from 'slate';

export type Options = {
  ignoreNodes?: string[];
  renderMenu: (editor: Editor, commands: Commands) => ReactNode;
  renderBackdrop: (commands: {
    onClose: () => void;
    onUpdate: () => void;
  }) => ReactNode;
  onShow: () => boolean;
  onHide: () => boolean;
};

export type Commands = {
  onClose: () => void;
  onUpdate: () => void;
};
