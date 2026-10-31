import type React from 'react';
import type {
  ConnectDragPreview,
  ConnectDragSource,
  ConnectDropTarget,
} from 'react-dnd';
import type { Editor, Path, PathRef } from 'slate';
import type { RenderElementProps } from 'slate-react';
import type { CustomElement, CustomText } from '../../../types';
import type { NodeIdPlugin } from '../NodeIdPlugin';

export type NodeWithId = Omit<CustomElement, 'children'> & {
  nodeId: string;
  children: (NodeWithId | CustomText)[];
};

export type DragNode = Omit<CustomElement, 'children'> & {
  nodeId?: string;
  children: (DragNode | CustomText)[];
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
  /** Optional ID generator for inserted copies; selection and movement do not require it. */
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
  nodes: DragNode[];
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
    sectionPaths?: Path[];
    /** Live references in the source editor; never use them in another editor. */
    pathRefs?: PathRef[];
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
