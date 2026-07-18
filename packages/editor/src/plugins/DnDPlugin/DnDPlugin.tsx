import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState } from 'react';
import { type ConnectDropTarget, useDrag, useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import { Editor, Element, Path, Transforms } from 'slate';
import {
  ReactEditor,
  type RenderElementProps,
  useReadOnly,
  useSlate,
} from 'slate-react';
import type { CustomElement } from '../../../types';
import { useEditorContext } from '../../provider';
import type { IPlugin } from '../../types';
import type { EditorDragItem, NodeWithId, Options } from './types';
import { getNodesByNodeIds } from './utils';

export class DnDPlugin implements IPlugin {
  constructor(private options: Options) {}

  init(editor: Editor) {
    return editor;
  }

  static DND_BLOCK_ELEMENT = 'block';

  handlers = {
    onDrop: (event: DragEvent) => {
      event.preventDefault();
    },
  };

  renderBlock = (props: RenderElementProps) => {
    const editor = useSlate();

    const { selectedNodes } = useEditorContext();
    const $selectedNodes = useStore(selectedNodes);

    const isCopying = useRef(false);
    const options = this.options;
    const generateId = this.options?.nodeIdPlugin?.generateId;
    const isReadOnly = useReadOnly();

    const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(
      null,
    );

    const dropTargetRef = useRef<HTMLElement | null>(null);

    const customType = options.customTypes?.[props.element.type];
    const currentElement = props.element as NodeWithId;

    const [, drag, preview] = useDrag({
      type: customType?.type || DnDPlugin.DND_BLOCK_ELEMENT,
      item: () => {
        const selected: Array<NodeWithId> = $selectedNodes;

        /**
         * We copy nodes that the user is dragging.
         * If a user drags multiple nodes, and the current node is one of them,
         * we copy selected nodes. Otherwise, we copy only the current node.
         */
        const nodes =
          selected.length > 0 &&
          selected.find((node) => node.nodeId === currentElement.nodeId)
            ? getNodesByNodeIds(
                editor,
                selected.map((node) => node.nodeId),
              )
            : [structuredClone(props.element as NodeWithId)];

        const item =
          this.options.customTypes?.[currentElement.type]?.getData?.(
            currentElement,
          );

        const items = nodes
          .map((node) => {
            if (this.options.customTypes?.[node.type]) {
              return this.options.customTypes[node.type].getData?.(node);
            }
            return null;
          })
          .filter(Boolean);

        const dragItem: EditorDragItem = {
          kind: 'inner',
          nodes,
          item,
          items,
          source: {
            editor,
            documentId: options.documentId,
          },
        };

        return dragItem;
      },
      canDrag: !isReadOnly,
      end: () => {
        selectedNodes.set([]);
      },
    });

    const allCustomTypes = Object.values(options.customTypes || {}).map(
      (customType) => customType.type,
    );

    const [{ isOver }, drop] = useDrop<
      EditorDragItem,
      void,
      { isOver: boolean }
    >({
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
        const element = dropTargetRef.current;
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
      drop: (data, monitor) => {
        const itemType = monitor.getItemType();
        const sourceEditor = data.kind === 'inner' ? data.source?.editor : null;

        const isSameDocument =
          data.kind === 'inner' &&
          data.source?.documentId === this.options.documentId &&
          this.options.documentId !== undefined;
        const isSameEditor =
          data.kind === 'inner' && data.source?.editor === editor;

        const sourceTo = ReactEditor.findPath(editor, props.element);

        if (!sourceTo) return;

        const insertAt = getDropPath(
          editor,
          sourceTo,
          dropPosition || 'bottom',
        );

        if (!insertAt) return;

        const customDropHandler =
          itemType && options.customDropHandlers?.[itemType];

        if (customDropHandler && data.kind === 'outer') {
          customDropHandler.onDrop({ editor, data, insertAt });
          return;
        }

        switch (itemType) {
          case NativeTypes.FILE:
            options.onDropFiles(
              editor,
              (data as unknown as { files: File[] }).files,
              insertAt,
            );
            break;
          default: {
            const dragItem = data as EditorDragItem;

            // We don't know what "default" behavior for the outer items is
            if (dragItem.kind === 'outer') {
              return;
            }

            if (!dropPosition || !dragItem.nodes.length) {
              return;
            }

            const nodeIds = dragItem.nodes.map((node) => node.nodeId);

            if (isSameDocument || isSameEditor) {
              if (!isCopying.current) {
                moveNode(editor, sourceTo, nodeIds, dropPosition);
              } else {
                if (!generateId) {
                  return;
                }

                const clonedNodes = cloneWithNewIds(dragItem.nodes, generateId);
                insertNodes(editor, insertAt, clonedNodes);
              }
            } else {
              if (!generateId) {
                return;
              }

              const clonedNodes = cloneWithNewIds(dragItem.nodes, generateId);

              insertNodes(editor, insertAt, clonedNodes);
              if (!isCopying.current && sourceEditor) {
                removeNodes(sourceEditor, nodeIds);
              }
            }
            selectedNodes.set([]);
            break;
          }
        }

        isCopying.current = false;
        setDropPosition(null);
      },
    });

    const connectDropRef: ConnectDropTarget = (el) => {
      dropTargetRef.current = el as HTMLElement | null;
      return drop(el);
    };

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

    return (
      <div>
        {options.renderBlock?.({
          props,
          dragRef: drag,
          dropRef: connectDropRef,
          previewRef: preview,
          position: dropPosition,
          onNativeDrop: (event) => {
            isCopying.current = event.altKey;
          },
          onToggleSelected: (event) => {
            event.stopPropagation();
            if ($selectedNodes.includes(props.element)) {
              selectedNodes.set(
                [...$selectedNodes].filter(
                  (element) => element !== props.element,
                ),
              );
            } else {
              selectedNodes.set([...$selectedNodes, props.element]);
            }
          },
        })}
      </div>
    );
  };
}

const getDropPath = (
  editor: Editor,
  targetNodePath: Path,
  position: 'top' | 'bottom',
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
  if (!Editor.hasPath(editor, dropPath)) {
    return;
  }

  Editor.withoutNormalizing(editor, () => {
    Transforms.moveNodes(editor, {
      at: [],
      match: (n) => {
        if (!Editor.isBlock(editor, n as CustomElement)) {
          return false;
        }

        if (Editor.isEditor(n)) {
          return false;
        }

        const node = n as NodeWithId;
        const shouldMove =
          typeof node.nodeId === 'string' && nodeIds.includes(node.nodeId);
        return shouldMove;
      },
      to: dropPath,
      mode: 'highest',
    });
  });
  Editor.normalize(editor);
};

const insertNodes = (editor: Editor, path: Path, nodes: NodeWithId[]) => {
  Editor.withoutNormalizing(editor, () => {
    Transforms.insertNodes(editor, nodes, { at: path });
  });
};

const removeNodes = (editor: Editor, nodeIds: string[]) => {
  try {
    Transforms.removeNodes(editor, {
      at: [],
      match: (n) => {
        if (!Element.isElement(n)) {
          return false;
        }

        if (!Editor.isBlock(editor, n)) {
          return false;
        }

        const node = n as NodeWithId;
        return typeof node.nodeId === 'string' && nodeIds.includes(node.nodeId);
      },
      mode: 'highest',
    });
  } catch {
    return;
  }
};

const cloneWithNewIds = (
  nodes: NodeWithId[],
  generateId: () => string,
): NodeWithId[] => {
  const copy = structuredClone(nodes);

  const assignId = (node: NodeWithId): void => {
    node.nodeId = generateId();
    node.children.forEach((node) => {
      if ('children' in node) {
        assignId(node);
      }
    });
  };

  copy.forEach(assignId);

  return copy;
};
