import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import type {
  DecoratedRange,
  Descendant,
  Editor,
  NodeEntry,
  NodeMatch,
} from 'slate';
import type { RenderElementProps, RenderLeafProps } from 'slate-react';
import type { CustomElement, CustomText } from '../types';

export interface IPlugin<
  TEditor extends Editor = Editor,
  TBlock extends CustomElement = CustomElement,
  TLeaf extends CustomText = CustomText,
> {
  init?: (editor: TEditor) => TEditor;
  blocks?: Block<TEditor, TBlock>[];
  leafs?: Leaf<TEditor, TLeaf>[];
  hotkeys?: Hotkey[];

  renderBlock?: (props: RenderElementProps) => ReactElement | null;
  renderLeaf?: (props: RenderLeafProps) => ReactElement | null;

  handlers?: {
    onDrop?: (event: DragEvent, editor: Editor) => void;
    onKeyDown?: (event: KeyboardEvent, editor: Editor) => void;
    onPaste?: (event: ClipboardEvent, editor: Editor) => void;
  };

  decorate?: (entry: NodeEntry) => DecoratedRange[];

  ui?: (params: UiParams) => ReactNode;
}

export type Block<
  TEditor extends Editor = Editor,
  TBlock extends CustomElement = CustomElement,
> = {
  type: string;
  render: (
    props: RenderElementProps & {
      element: CustomElement & TBlock;
    },
    editor: TEditor,
  ) => ReactElement | null;
  serialize?: Serialize;
  deserialize?: Deserialize;
  isVoid?: boolean;
  isInline?: boolean;
  onBeforeDelete?: (blocks: TBlock[]) => Promise<boolean>;
  onDelete?: (blocks: TBlock[]) => void;
};

export type Leaf<T extends Editor, TLeaf extends CustomText = CustomText> = {
  render: (
    props: RenderLeafProps & {
      leaf: CustomText & TLeaf;
    },
    editor: T,
  ) => ReactElement | null;
  isVoid?: boolean;
  serialize?: Serialize;
  deserialize?: Deserialize;
};

type Hotkey = readonly [string, (event: KeyboardEvent, editor: Editor) => void];

export type UiParams = {
  editor: Editor;
  readOnly: boolean;
  children: ReactNode;
};

export type EditorRef = {
  serialize: (node: CustomElement | CustomText) => string;
  deserialize: (
    element: HTMLElement,
  ) => (Descendant | string)[] | string | Descendant | null;
  isEmpty: () => boolean;
  deleteNode: (match: NodeMatch<CustomElement>) => void;
  focus: (mode?: 'end') => void;
};

export type Serialize = (
  node: CustomElement | CustomText,
  children?: string,
) => string | undefined;

export type Deserialize = (
  element: HTMLElement,
  children?: (string | Descendant)[],
) => CustomElement | CustomText[] | undefined;
