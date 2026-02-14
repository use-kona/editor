import { useStore } from '@nanostores/react';
import { type MapStore, map } from 'nanostores';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  type ConnectDragPreview,
  type ConnectDragSource,
  type ConnectDropTarget,
  useDrag,
  useDrop,
} from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import { Editor, Path, Transforms } from 'slate';
import {
  ReactEditor,
  type RenderElementProps,
  useReadOnly,
  useSlate,
} from 'slate-react';
import type { CustomElement } from '../../../types';
import type { IPlugin } from '../../types';

type Options = {
  onDropFiles: (editor: Editor, files: File[], path: Path) => void;
  renderBlock?: (params: {
    props: RenderElementProps;
    dragRef: ConnectDragSource;
    dropRef: ConnectDropTarget;
    previewRef: ConnectDragPreview;
    position: 'top' | 'bottom' | null;
    selected?: boolean;
    onToggleSelected: () => void;
  }) => React.ReactNode;
  ignoreNodes?: string[];
  customTypes?: {
    [type: string]: {
      type: string | symbol;
      getData?: (element: CustomElement) => Record<string, unknown>;
      getDndItem?: (element: CustomElement) => Record<string, unknown>;
    };
  };
};

type DnDItem = {
  element: CustomElement;
  nodeIds?: string[];
};

type DnDNode = CustomElement & {
  nodeId?: string;
};

export class DnDPlugin implements IPlugin {
  store: MapStore<{ selected: Set<string> }>;

  constructor(private options: Options) {
    this.store = map({
      selected: new Set(),
    });
  }

  handleToggleSelected = (nodeId: string) => {
    const selected = new Set(this.store.get().selected);
    if (selected.has(nodeId)) {
      selected.delete(nodeId);
    } else {
      selected.add(nodeId);
    }

    this.store.set({
      selected,
    });
  };

  static DND_BLOCK_ELEMENT = 'block';

  handlers = {
    onDrop: (event: DragEvent) => {
      event.preventDefault();
    },
  };

  renderBlock = (props: RenderElementProps) => {
    const editor = useSlate();

    const $store = useStore(this.store);

    const options = this.options;
    const isReadOnly = useReadOnly();

    const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(
      null,
    );

    const customType = options.customTypes?.[props.element.type];
    const currentElement = props.element as DnDNode;

    const [, drag, preview] = useDrag({
      type: customType?.type || DnDPlugin.DND_BLOCK_ELEMENT,
      item: {
        ...(customType?.getData?.(props.element) || {}),
        element: props.element,
        nodeIds: Array.from($store.selected.values()),
      },
      ...(customType?.getDndItem?.(props.element) || {}),
      canDrag: !isReadOnly,
    });

    const allCustomTypes = Object.values(options.customTypes || {}).map(
      (customType) => customType.type,
    );

    const [{ isOver }, drop] = useDrop({
      accept: [
        DnDPlugin.DND_BLOCK_ELEMENT,
        NativeTypes.FILE,
        ...allCustomTypes,
      ],
      collect(monitor) {
        return {
          item: monitor.getItem(),
          isOver: monitor.isOver(),
          position: monitor.isOver() ? monitor.getClientOffset() : null,
        };
      },
      hover(_, monitor) {
        const element = ReactEditor.toDOMNode(
          editor,
          props.element,
        ) as HTMLElement;
        if (!element) return;

        const hoverBoundingRect = element.getBoundingClientRect();
        const hoverMiddleY =
          (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) return;

        const hoverClientY = clientOffset.y - hoverBoundingRect.top;

        if (hoverClientY < hoverMiddleY) {
          setDropPosition('top');
        } else {
          setDropPosition('bottom');
        }
      },
      drop(item, monitor) {
        const itemType = monitor.getItemType();

        const sourceTo = ReactEditor.findPath(editor, props.element);

        if (!sourceTo) return;

        const dropPath = getDropPath(editor, sourceTo, dropPosition);

        if (!dropPath) return;

        switch (itemType) {
          case NativeTypes.FILE:
            options.onDropFiles(
              editor,
              (item as { files: File[] }).files,
              dropPath,
            );
            break;
          default: {
            const dragItem = item as DnDItem;

            if (!dropPosition || !dragItem.nodeIds?.length) {
              return;
            }

            moveNode(editor, sourceTo, dragItem.nodeIds, dropPosition);
            break;
          }
        }

        setDropPosition(null);
      },
    });

    // biome-ignore lint/correctness/useExhaustiveDependencies: we care only about this dep
    useEffect(() => {
      setDropPosition(null);
    }, [isOver]);

    if (this.options.ignoreNodes?.includes(props.element.type)) {
      return props.children;
    }

    if (editor.isInline(props.element)) {
      return props.children;
    }

    return options.renderBlock?.({
      props,
      dragRef: drag,
      dropRef: drop,
      previewRef: preview,
      position: dropPosition,
      selected:
        typeof currentElement.nodeId === 'string'
          ? $store.selected.has(currentElement.nodeId)
          : false,
      onToggleSelected: () => {
        if (typeof currentElement.nodeId === 'string') {
          this.handleToggleSelected(currentElement.nodeId);
        }
      },
    });
  };
}

const getDropPath = (
  editor: Editor,
  targetNodePath: Path,
  position: 'top' | 'bottom' | null,
) => {
  const target = Editor.node(editor, targetNodePath);

  switch (position) {
    case 'top':
      return target[1];
    case 'bottom':
      return Path.next(target[1]);
  }
};

const moveNode = (
  editor: Editor,
  targetNodePath: Path,
  nodeIds: string[],
  position: 'top' | 'bottom',
) => {
  const dropPath = getDropPath(editor, targetNodePath, position);

  if (!dropPath) return;

  // nodeIds.reverse().forEach((nodeId) => {
  Transforms.moveNodes(editor, {
    // at: sourceNodePath,
    at: [],
    match: (n) => {
      if (!Editor.isBlock(editor, n as CustomElement)) {
        return false;
      }

      const node = n as DnDNode;
      const shouldMove =
        typeof node.nodeId === 'string' && nodeIds.includes(node.nodeId);
      return shouldMove;
    },
    to: dropPath,
    mode: 'highest',
  });
  // });
};
