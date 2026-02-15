import type { ReactNode } from 'react';

import type { Editor } from 'slate';
import type { CustomElement } from '../../../types';

export type Options = {
  commands: Command[];
  renderMenu: (children: ReactNode) => ReactNode;
  ignoreNodes?: string[];
};

export type CommandsStore = {
  isOpen: boolean;
  filter: boolean | string;
  openId: number;
};

export type CommandPathEntry = {
  name: string;
  title: string;
  commandName: string;
};

export type GetCommandsContext = {
  query: string;
  editor: Editor;
  path: CommandPathEntry[];
  parent: Command;
};

export type Command = {
  name: string;
  title: string;
  commandName: string;
  icon: ReactNode;
  action?: (actions: Actions, editor: Editor) => void;
  getCommands?: (context: GetCommandsContext) => Command[] | Promise<Command[]>;
  render?: (params: {
    command: Command;
    isSubmenu: boolean;
    isActive: boolean;
  }) => ReactNode;
};

export type Actions = {
  removeCommand: () => void;
  set: (params: Partial<CustomElement>, options?: any) => void;
  insert: (params: CustomElement) => void;
  wrap: (params: CustomElement, options?: any) => void;
  insertText: (text: string) => void;
};
