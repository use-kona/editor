import type { RenderElementProps } from 'slate-react';
import { DragIcon } from '../icons/drag';
import { HeadingsPlugin, ListsPlugin } from '../plugins';
import styles from './DragHandler.module.css';

export const DragHandler = (props: RenderElementProps) => {
  switch (props.element.type) {
    case ListsPlugin.LIST_ITEM_ELEMENT:
      return (
        <div className={styles.dragHandler}>
          <DragIcon size={16} />
        </div>
      );
    case HeadingsPlugin.HeadingLevel1:
      return (
        <div className={styles.dragHandlerHeading1}>
          <DragIcon size={16} />
        </div>
      );
    case HeadingsPlugin.HeadingLevel2:
      return (
        <div className={styles.dragHandlerHeading2}>
          <DragIcon size={16} />
        </div>
      );
    case HeadingsPlugin.HeadingLevel3:
      return (
        <div className={styles.dragHandlerHeading3}>
          <DragIcon size={16} />
        </div>
      );
    default:
      return (
        <div className={styles.dragHandler}>
          <DragIcon size={16} />
        </div>
      );
  }
};
