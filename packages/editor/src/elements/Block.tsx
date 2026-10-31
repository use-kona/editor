import { useStore } from '@nanostores/react';
import { Editor } from 'slate';
import { type RenderElementProps, useSlateStatic } from 'slate-react';
import { useEditorContext } from '../provider';

export const Block = (props: RenderElementProps) => {
  const editor = useSlateStatic();
  const { selectedNodes } = useEditorContext();
  const $selectedNodes = useStore(selectedNodes);

  const isSelected = $selectedNodes.some((node) => node === props.element);

  const handleClick = () => {
    if (Editor.isVoid(editor, props.element)) {
      selectedNodes.set([props.element]);
    } else {
      selectedNodes.set([]);
    }
  };

  return (
    <div
      data-editor-block
      data-editor-selected={isSelected || undefined}
      onClick={handleClick}
    >
      {props.children}
    </div>
  );
};
