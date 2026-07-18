import type React from 'react';
import type {
  ConnectDragPreview,
  ConnectDragSource,
  ConnectDropTarget,
} from 'react-dnd';
import type { Editor, Path } from 'slate';
import type { RenderElementProps } from 'slate-react';
import type { CustomElement, CustomText } from '../../../types';
import type { NodeIdPlugin } from '../NodeIdPlugin';

export type NodeWithId = Omit<CustomElement, 'children'> & {
  nodeId: string;
  children: (NodeWithId | CustomText)[];
};

export const isNodeWithId = (node: unknown): node is NodeWithId =>
  typeof node === 'object' && node !== null && 'nodeId' in node;

export type CustomDropHandler<T = unknown> = {
  type: string | symbol;
  onDrop: (context: CustomDropContext<T>) => DropResult;
};

export type Options = {
  editorId?: string;
  documentId?: string | null;
  onDropFiles: (editor: Editor, files: File[], path: Path) => void;
  renderBlock?: (params: {
    props: RenderElementProps;
    dragRef: ConnectDragSource;
    dropRef: ConnectDropTarget;
    previewRef: ConnectDragPreview;
    position: 'top' | 'bottom' | null;
    onNativeDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
    onToggleSelected?: (event: React.MouseEvent<HTMLDivElement>) => void;
  }) => React.ReactNode;
  ignoreNodes?: string[];
  customTypes?: {
    [type: string]: {
      type: string | symbol;
      getData?: (element: CustomElement) => unknown;
    };
  };
  customDropHandlers?: {
    [type: string | symbol]: CustomDropHandler;
  };
  nodeIdPlugin?: NodeIdPlugin;
};

export type CustomDropContext<TItem = unknown> = {
  editor: Editor;
  data: EditorOuterDragItem<TItem>;
  insertAt: Path;
};

type DropResult = 'handled' | 'ignored';

export type EditorInnerDragItem<TItem = unknown> = {
  kind: 'inner';
  nodes: NodeWithId[];
  item?: TItem;
  items?: TItem[];
  source: {
    editor: Editor;
    /**
     * Different editors have different unique identifiers.
     */
    editorId?: string;
    /**
     * But different editors may have the same document opened. In this case,
     * editor1.documentId will be the same as editor2.documentId.
     */
    documentId?: string | null;
    path?: Path;
  };
  data?: Record<string, unknown>;
};

export type EditorOuterDragItem<TItem = unknown> = {
  kind: 'outer';
  item: TItem;
  items: TItem[];
};

/**
 * We're using this type to represent a drag item that is being dragged from the editor.
 */
export type EditorDragItem<TItem = unknown> =
  | EditorInnerDragItem<TItem>
  | EditorOuterDragItem<TItem>;
