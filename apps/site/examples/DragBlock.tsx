import cn from 'clsx';
import type * as React from 'react';
import type {
  ConnectDragPreview,
  ConnectDragSource,
  ConnectDropTarget,
} from 'react-dnd';
import { type RenderElementProps, useSelected } from 'slate-react';
import styles from './DragBlock.module.css';
import { DragHandler } from './DragHandler';
import { useMergeRefs } from './ui/useMergeRefs';

type Props = {
  props: RenderElementProps;
  dragRef: ConnectDragSource;
  dropRef: ConnectDropTarget;
  previewRef: ConnectDragPreview;
  position: 'top' | 'bottom' | null;
  selected?: boolean;
  onToggleSelected?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onNativeDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
};

export const DragBlock = (props: Props) => {
  const {
    props: { attributes, element, children },
    dragRef: drag,
    dropRef: drop,
    previewRef: preview,
    position,
    onToggleSelected,
    onNativeDrop,
  } = props;

  const handleToggleSelected = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.metaKey) {
      onToggleSelected(event);
    }
  };

  const handleNativeDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (onNativeDrop) {
      onNativeDrop(event);
    }
  };

  const rootRef = useMergeRefs([
    attributes.ref,
    (e: HTMLDivElement) => drop(preview(e)),
  ]);

  return (
    <div
      className={cn(styles.root, {
        [styles.top]: position === 'top',
        [styles.bottom]: position === 'bottom',
      })}
      {...attributes}
      ref={rootRef}
      onDrop={handleNativeDrop}
    >
      <div className={styles.block}>
        <div
          className={styles.drag}
          ref={(element) => {
            drag(element);
          }}
          onClick={handleToggleSelected}
          contentEditable={false}
        >
          <DragHandler attributes={attributes} element={element}>
            {children}
          </DragHandler>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
