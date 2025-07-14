import { type Descendant, Editor, type Element, Node } from 'slate';
import {
  type RenderLeafProps,
  useFocused,
  useReadOnly,
  useSelected,
} from 'slate-react';
import type { CustomElement } from '../../../types';
import type { IPlugin } from '../../types';
import { isEmpty as isEditorEmptyFn } from '../../utils';
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
          at: editor.selection?.focus,
          mode: 'lowest',
          voids: true,
        });

        const firstEntity = Editor.above(editor, {
          mode: 'lowest',
          at: [0, 0],
        });

        if (entity && this.options.ignoreNodes?.includes(entity[0].type)) {
          return props.children;
        }

        const hasVoids = entity?.[0].children.some((n: Descendant) => {
          return Editor.isVoid(editor, n as Element);
        });

        const isEmpty =
          (!entity || Node.string(entity[0]) === '') &&
          !hasVoids &&
          !Editor.isVoid(editor, entity?.[0] as Element);

        const isEditorEmpty = isEditorEmptyFn(editor.children)

        const isVisible =
          (isEmpty && !isReadOnly && isSelected) || isEditorEmpty;

        return (
          <>
            <span {...props.attributes}>
              <span
                className={isVisible ? styles.placeholder : styles.hidden}
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
