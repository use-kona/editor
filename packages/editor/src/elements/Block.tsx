import { useStore } from '@nanostores/react';
import { Editor } from 'slate';
import { type RenderElementProps, useSlateStatic } from 'slate-react';
import styles from '../core/styles.module.css';
import { useEditorContext } from '../provider';

export const Block = (props: RenderElementProps) => {
  const editor = useSlateStatic();
  const { selectedNodes } = useEditorContext();
  const $selectedNodes = useStore(selectedNodes);

  const isSelected = $selectedNodes.some((node) => node === props.element);

  const classes = isSelected
    ? `${styles.block} ${styles.selected}`
    : styles.block;

  const handleClick = () => {
    if (Editor.isVoid(editor, props.element)) {
      selectedNodes.set([props.element]);
    } else {
      selectedNodes.set([]);
    }
  };

  return (
    <div className={classes} onClick={handleClick}>
      {props.children}
    </div>
  );
};
