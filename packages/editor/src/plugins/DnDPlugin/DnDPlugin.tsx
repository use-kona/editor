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
import { useEditorContext } from '../../provider';
import type { IPlugin } from '../../types';
import {
  getCollapsibleSectionPaths,
  isHiddenByCollapsedSection,
} from '../CollapsibleBlocksPlugin/CollapsibleBlocksPlugin';
import type {
  DragNode,
  EditorDragItem,
  EditorInnerDragItem,
  Options,
} from './types';

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

    const isCopying = useRef(false);
    const options = this.options;
    const generateId = this.options?.nodeIdPlugin?.generateId;
    const isReadOnly = useReadOnly();

    const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(
      null,
    );

    const dropTargetRef = useRef<HTMLElement | null>(null);

    const customType = options.customTypes?.[props.element.type];
    const currentElement = props.element;
    const path = ReactEditor.findPath(editor, props.element);
    const isHidden = isHiddenByCollapsedSection(editor, path);

    const [, drag, preview] = useDrag<EditorInnerDragItem>({
      type: customType?.type || DnDPlugin.DND_BLOCK_ELEMENT,
      item: () => {
        const selected = selectedNodes.get();
        const sourcePath = ReactEditor.findPath(editor, props.element);
        const sectionPaths = getCollapsibleSectionPaths(editor, sourcePath);
        const selectedSet = new Set(
          selected.includes(currentElement) ? selected : [currentElement],
        );
        const paths =
          sectionPaths ||
          Array.from(
            Editor.nodes(editor, {
              at: [],
              match: (node) =>
                Element.isElement(node) &&
                Editor.isBlock(editor, node) &&
                selectedSet.has(node),
              mode: 'highest',
            }),
            ([, path]) => path,
          );
        const nodes = getNodesAtPaths(editor, paths);

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

        const dragItem: EditorInnerDragItem = {
          kind: 'inner',
          nodes,
          item,
          items,
          source: {
            editor,
            documentId: options.documentId,
            path: sourcePath,
            sectionPaths: sectionPaths || undefined,
            pathRefs: paths.map((path) => Editor.pathRef(editor, path)),
          },
        };

        return dragItem;
      },
      canDrag: !isReadOnly,
      end: (item) => {
        releaseDragRefs(item);
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
        const position = getDropPosition(dropTargetRef.current, monitor);
        if (position) setDropPosition(position);
      },
      drop: (data, monitor) => {
        if (monitor.didDrop()) return;
        try {
          const itemType = monitor.getItemType();
          const sourceEditor =
            data.kind === 'inner' ? data.source?.editor : null;

          const isSameDocument =
            data.kind === 'inner' &&
            data.source?.documentId === this.options.documentId &&
            typeof this.options.documentId === 'string' &&
            this.options.documentId.length > 0;
          const isSameEditor =
            data.kind === 'inner' && data.source?.editor === editor;

          const sourceTo = ReactEditor.findPath(editor, props.element);

          if (!sourceTo) return;

          const position =
            getDropPosition(dropTargetRef.current, monitor) ||
            dropPosition ||
            'bottom';

          const insertAt = getDropPath(editor, sourceTo, position);

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

              // Resolve the live source at drop time: edits can shift paths,
              // change content, or delete some of the dragged blocks.
              const sourcePaths = getSourcePaths(dragItem);
              const nodes = dragItem.source.pathRefs
                ? getNodesAtPaths(dragItem.source.editor, sourcePaths)
                : dragItem.nodes;
              if (!nodes.length || !sourcePaths.length) return;

              if (isCopying.current) {
                insertNodes(
                  editor,
                  insertAt,
                  cloneForInsert(nodes, generateId),
                );
              } else if (isSameEditor) {
                moveNode(
                  editor,
                  sourceTo,
                  [],
                  position,
                  undefined,
                  sourcePaths,
                );
              } else if (isSameDocument) {
                // Path references belong to the source editor. Separate views of
                // one document must map every block by a stable ID instead.
                const nodeIds = nodes.flatMap((node) =>
                  typeof node.nodeId === 'string' ? [node.nodeId] : [],
                );
                const mappedPaths = getPathsByIds(editor, nodeIds);
                if (
                  nodeIds.length !== nodes.length ||
                  mappedPaths.length !== nodes.length ||
                  new Set(nodeIds).size !== nodes.length
                )
                  return;
                moveNode(
                  editor,
                  sourceTo,
                  [],
                  position,
                  undefined,
                  mappedPaths,
                );
              } else {
                insertNodes(
                  editor,
                  insertAt,
                  cloneForInsert(nodes, generateId),
                );
                if (sourceEditor)
                  removeNodes(sourceEditor, getSourcePaths(dragItem));
              }
              selectedNodes.set([]);
              break;
            }
          }
        } finally {
          if (data.kind === 'inner') releaseDragRefs(data);
          isCopying.current = false;
          setDropPosition(null);
        }
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
      <div hidden={isHidden}>
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
            const selected = selectedNodes.get();
            if (selected.includes(props.element)) {
              selectedNodes.set(
                [...selected].filter((element) => element !== props.element),
              );
            } else {
              selectedNodes.set([...selected, props.element]);
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

const getDropPosition = (
  element: HTMLElement | null,
  monitor: { getClientOffset: () => { y: number } | null },
) => {
  if (!element) return null;

  const clientOffset = monitor.getClientOffset();
  if (!clientOffset) return null;

  const rect = element.getBoundingClientRect();
  return clientOffset.y - rect.top < (rect.bottom - rect.top) / 2
    ? 'top'
    : 'bottom';
};

export const moveNode = (
  editor: Editor,
  targetNodePath: Path,
  nodeIds: string[],
  position: 'top' | 'bottom',
  sourcePath?: Path,
  sourcePaths?: Path[],
) => {
  const dropPath = getDropPath(editor, targetNodePath, position);

  if (!dropPath) return;
  if (!isValidInsertPath(editor, dropPath)) {
    return;
  }

  const explicitPaths = sourcePaths
    ? sourcePaths
    : nodeIds.length === 0 && sourcePath
      ? [sourcePath]
      : undefined;
  const explicitNodes =
    explicitPaths &&
    new Set(
      explicitPaths
        .filter((path) => Editor.hasPath(editor, path))
        .map((path) => Editor.node(editor, path)[0]),
    );
  const paths = Array.from(
    Editor.nodes(editor, {
      at: [],
      match: (n) => {
        if (explicitNodes) return explicitNodes.has(n);
        const nodeId = (n as DragNode).nodeId;
        return (
          Element.isElement(n) &&
          Editor.isBlock(editor, n) &&
          typeof nodeId === 'string' &&
          nodeIds.includes(nodeId)
        );
      },
      mode: 'highest',
    }),
    ([, path]) => path,
  );

  // A selected target (or its ancestor) cannot also anchor the move.
  if (
    paths.some(
      (path) =>
        Path.equals(path, targetNodePath) ||
        Path.isAncestor(path, targetNodePath),
    )
  ) {
    return;
  }

  const targetRef = Editor.pathRef(editor, targetNodePath);
  const sourceRefs = paths.map((path) => Editor.pathRef(editor, path));

  Editor.withoutNormalizing(editor, () => {
    try {
      // Keep every move anchored to the target as earlier moves shift paths.
      // Inserting after the target runs in reverse to preserve document order.
      const orderedRefs =
        position === 'top' ? sourceRefs : [...sourceRefs].reverse();
      for (const sourceRef of orderedRefs) {
        const from = sourceRef.current;
        const target = targetRef.current;
        if (!from || !target) continue;

        let to = position === 'top' ? target : Path.next(target);
        // Slate's sibling destination is the index after removing the source.
        if (Path.isSibling(from, to) && Path.isBefore(from, to)) {
          to = Path.previous(to);
        }
        Transforms.moveNodes(editor, { at: from, to });
      }
    } finally {
      targetRef.unref();
      for (const ref of sourceRefs) ref.unref();
    }
  });
  Editor.normalize(editor);
};

const isValidInsertPath = (editor: Editor, path: Path) => {
  const parentPath = Path.parent(path);
  const index = path[path.length - 1];

  if (index === undefined || !Editor.hasPath(editor, parentPath)) {
    return false;
  }

  const [parent] = Editor.node(editor, parentPath);
  return 'children' in parent && index <= parent.children.length;
};

const insertNodes = (editor: Editor, path: Path, nodes: DragNode[]) => {
  Editor.withoutNormalizing(editor, () => {
    Transforms.insertNodes(editor, nodes, { at: path });
  });
};

const getNodesAtPaths = (editor: Editor, paths: Path[]) =>
  paths
    .filter((path) => Editor.hasPath(editor, path))
    .map((path) => structuredClone(Editor.node(editor, path)[0] as DragNode));

const removeNodes = (editor: Editor, paths: Path[]) => {
  const refs = paths.map((path) => Editor.pathRef(editor, path));
  Editor.withoutNormalizing(editor, () => {
    try {
      for (const ref of refs.reverse()) {
        if (ref.current) Transforms.removeNodes(editor, { at: ref.current });
      }
    } finally {
      for (const ref of refs) ref.unref();
    }
  });
};

const getPathsByIds = (editor: Editor, nodeIds: string[]): Path[] => {
  const ids = new Set(nodeIds);
  if (!ids.size) return [];
  const entries = Array.from(
    Editor.nodes<DragNode>(editor, {
      at: [],
      match: (node) => {
        const nodeId = (node as DragNode).nodeId;
        return (
          Element.isElement(node) &&
          Editor.isBlock(editor, node) &&
          typeof nodeId === 'string' &&
          ids.has(nodeId)
        );
      },
      mode: 'highest',
    }),
  );
  // Require a one-to-one mapping, including when a view has duplicate IDs.
  if (
    entries.length !== ids.size ||
    new Set(entries.map(([node]) => node.nodeId)).size !== ids.size
  )
    return [];
  return entries.map(([, path]) => path);
};

const getSourcePaths = (item: EditorInnerDragItem): Path[] => {
  if (item.source.pathRefs) {
    return item.source.pathRefs.flatMap((ref) =>
      ref.current ? [ref.current] : [],
    );
  }
  // Keep accepting drag payloads from consumers using the previous shape.
  if (item.source.sectionPaths) return item.source.sectionPaths;
  const nodeIds = item.nodes.flatMap((node) =>
    typeof node.nodeId === 'string' ? [node.nodeId] : [],
  );
  if (nodeIds.length) return getPathsByIds(item.source.editor, nodeIds);
  return item.source.path ? [item.source.path] : [];
};

const releaseDragRefs = (item: EditorInnerDragItem) => {
  for (const ref of item.source.pathRefs || []) ref.unref();
};

const cloneForInsert = (
  nodes: DragNode[],
  generateId?: () => string,
): DragNode[] => {
  const copy = structuredClone(nodes);
  const assignId = (node: DragNode): void => {
    if (generateId) node.nodeId = generateId();
    // Let a destination NodeIdPlugin assign IDs on insertion when no
    // generator was supplied to DnD; never duplicate source IDs.
    else delete node.nodeId;
    for (const child of node.children) {
      if ('children' in child) assignId(child);
    }
  };
  copy.forEach(assignId);
  return copy;
};
