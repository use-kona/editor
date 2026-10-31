import { type Descendant, Editor, Element, Node, Range } from 'slate';
import {
  type RenderLeafProps,
  useFocused,
  useReadOnly,
  useSlateSelection,
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
        const selection = useSlateSelection();
        const isReadOnly = useReadOnly();
        const isFocused = useFocused();

        const entity = Editor.above<CustomElement>(editor, {
          at: selection ? Range.start(selection) : Editor.start(editor, []),
          match: (node) =>
            Element.isElement(node) && Editor.isBlock(editor, node),
          mode: 'lowest',
          voids: true,
        });

        if (entity && this.options.ignoreNodes?.includes(entity[0].type)) {
          return props.children;
        }

        const hasVoids = entity?.[0].children.some((n: Descendant) => {
          return Editor.isVoid(editor, n as Element);
        });

        const isEmpty =
          !!entity &&
          Node.string(entity[0]) === '' &&
          !hasVoids &&
          !Editor.isVoid(editor, entity[0]);

        const isEditorEmpty = isEditorEmptyFn(editor.children);
        const isFirstText =
          !!entity &&
          Node.leaf(editor, Editor.start(editor, entity[1]).path) ===
            props.text;

        const isVisible =
          isFirstText &&
          ((isEmpty && !isReadOnly && !!selection) || isEditorEmpty);

        return (
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
        );
      },
    },
  ];
}
