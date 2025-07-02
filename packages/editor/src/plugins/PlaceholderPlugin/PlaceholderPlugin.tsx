import { Editor, Node } from 'slate';
import {
  type RenderLeafProps,
  useFocused,
  useReadOnly,
  useSelected,
} from 'slate-react';
import type { CustomElement } from '../../../types';
import type { IPlugin } from '../../types';
import styles from './styles.module.css';

type Options = {
  focused?: string;
  unfocused?: string;
  ignoreNodes?: string[];
};

export class PlaceholderPlugin implements IPlugin {
  constructor(private options: Options) {}

  leafs = [
    {
      render: (props: RenderLeafProps, editor: Editor) => {
        const isSelected = useSelected();
        const isReadOnly = useReadOnly();
        const isFocused = useFocused();

        const entity = Editor.above<CustomElement>(editor, {
          mode: 'lowest',
        });

        const firstEntity = Editor.above(editor, {
          mode: 'lowest',
          at: [0, 0],
        });

        if (entity && this.options.ignoreNodes?.includes(entity[0].type)) {
          return props.children;
        }

        const isEmpty = !entity || Node.string(entity[0]) === '';
        const isEditorEmpty =
          !firstEntity ||
          (Node.string(firstEntity[0]) === '' && editor.children.length <= 1);

        const isVisible =
          (isEmpty && !isReadOnly && isSelected) || isEditorEmpty;

        return (
          <>
            <span {...props.attributes}>
              <span
                className={isVisible ? styles.placeholder : undefined}
                data-placeholder={
                  isFocused ? this.options.focused : this.options.unfocused
                }
              >
                {props.children}
              </span>
            </span>
          </>
        );
      },
    },
  ];
}
