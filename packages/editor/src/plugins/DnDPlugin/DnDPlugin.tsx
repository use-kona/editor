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
  }) => React.ReactNode;
  ignoreNodes?: string[];
  customTypes?: {
    [type: string]: {
      type: string | symbol;
      getData?: (element: CustomElement) => Record<string, unknown>;
    };
  };
};

export class DnDPlugin implements IPlugin {
  constructor(private options: Options) {}

  static DND_BLOCK_ELEMENT = 'block';

  handlers = {
    onDrop: (event: DragEvent) => {
      event.preventDefault();
    },
  };

  renderBlock = (props: RenderElementProps) => {
    const editor = useSlate();

    const options = this.options;
    const isReadOnly = useReadOnly();

    const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(
      null,
    );

    const customType = options.customTypes?.[props.element.type];

    const [, drag, preview] = useDrag({
      type: customType?.type || DnDPlugin.DND_BLOCK_ELEMENT,
      item: {
        ...(customType?.getData?.(props.element) || {}),
        element: props.element,
      },
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
            const targetTo = ReactEditor.findPath(
              editor,
              (item as { element: CustomElement }).element,
            );

            if (!dropPosition) {
              return;
            }

            moveNode(editor, sourceTo, targetTo, dropPosition);
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
  sourceNodePath: Path,
  position: 'top' | 'bottom',
) => {
  const dropPath = getDropPath(editor, targetNodePath, position);

  if (!dropPath) return;

  Transforms.moveNodes(editor, {
    at: sourceNodePath,
    to: dropPath,
    mode: 'highest',
  });
};
