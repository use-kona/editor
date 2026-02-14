import cn from 'clsx';
import type {
  ConnectDragPreview,
  ConnectDragSource,
  ConnectDropTarget,
} from 'react-dnd';
import type { RenderElementProps } from 'slate-react';
import styles from './DragBlock.module.css';
import { DragHandler } from './DragHandler';

type Props = {
  props: RenderElementProps;
  dragRef: ConnectDragSource;
  dropRef: ConnectDropTarget;
  previewRef: ConnectDragPreview;
  position: 'top' | 'bottom' | null;
  selected?: boolean;
  onToggleSelected: () => void;
};

export const DragBlock = (props: Props) => {
  const {
    props: { attributes, element, children },
    dragRef: drag,
    dropRef: drop,
    previewRef: preview,
    position,
    selected,
    onToggleSelected,
  } = props;

  const handleToggleSelected = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.metaKey) {
      onToggleSelected();
    }
  };

  return (
    <div
      className={cn(styles.root, {
        [styles.top]: position === 'top',
        [styles.bottom]: position === 'bottom',
        [styles.selected]: selected,
      })}
      {...attributes}
    >
      <div
        className={styles.block}
        ref={(e) => {
          drop(preview(e));
        }}
      >
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
