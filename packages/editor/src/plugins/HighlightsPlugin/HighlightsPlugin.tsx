import type { KeyboardEvent } from 'react';
import { Editor, Element, Range, Transforms } from 'slate';
import type { RenderLeafProps } from 'slate-react';
import type { CustomElement } from '../../../types';
import type { IPlugin } from '../../types';
import styles from './styles.module.css';

type HighlightElement = {
  highlight: string;
};

type Options = {
  colors: Record<string, string>;
};

export class HighlightsPlugin implements IPlugin {
  constructor(private options: Options) {}

  init(editor: Editor) {
    const { insertBreak } = editor;

    editor.insertBreak = () => {
      const marks = isAtHighlightEnd(editor) ? Editor.marks(editor) : null;

      insertBreak();

      if (marks && editor.selection && Range.isCollapsed(editor.selection)) {
        const [leaf] = Editor.leaf(editor, editor.selection.anchor);
        if (leaf.text === '') {
          // Keep the empty paragraph plain even after the caret leaves it.
          Transforms.unsetNodes(editor, 'highlight', {
            at: editor.selection.anchor.path,
          });
        }

        // Splitting at a boundary can inherit the following text's marks.
        // Keep the caret's original formatting, except for its highlight.
        editor.marks = marks;
        Editor.removeMark(editor, 'highlight');
      }
    };

    return editor;
  }

  handlers = {
    onKeyDown: (event: KeyboardEvent, editor: Editor) => {
      if (
        event.defaultPrevented ||
        event.key !== 'ArrowRight' ||
        event.shiftKey ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.nativeEvent.isComposing ||
        !isAtHighlightEnd(editor)
      ) {
        return;
      }

      event.preventDefault();
      Editor.removeMark(editor, 'highlight');
    },
  };

  static toggleHighlight(editor: Editor, color: string) {
    const isActive = HighlightsPlugin.isHighlightActive(editor, color);
    if (isActive) {
      Editor.removeMark(editor, 'highlight');
    } else {
      Editor.addMark(editor, 'highlight', color);
    }
  }

  static isHighlightActive(editor: Editor, color: string) {
    const marks: Record<string, string> | null = Editor.marks(editor);
    return marks ? marks.highlight === color : false;
  }

  static removeHighlight(editor: Editor) {
    Editor.removeMark(editor, 'highlight');
  }

  leafs = [
    {
      render: (props: RenderLeafProps) => {
        const { leaf, attributes, children } = props;

        let content = children;

        if ((leaf as unknown as HighlightElement).highlight) {
          content = (
            <span
              className={styles.highlight}
              style={{
                backgroundColor:
                  this.options.colors[
                    (leaf as unknown as HighlightElement).highlight
                  ],
              }}
            >
              {content}
            </span>
          );
        }

        return <span {...attributes}>{content}</span>;
      },
    },
  ];
}

const isAtHighlightEnd = (editor: Editor) => {
  const { selection } = editor;
  if (!selection || !Range.isCollapsed(selection)) return false;

  const marks: Record<string, unknown> | null = Editor.marks(editor);
  const highlight = marks?.highlight;
  if (!highlight) return false;

  const block = Editor.above<CustomElement>(editor, {
    match: (node) => Element.isElement(node) && Editor.isBlock(editor, node),
    mode: 'lowest',
  });
  if (!block || Editor.isVoid(editor, block[0])) return false;

  if (Editor.isEnd(editor, selection.anchor, block[1])) return true;

  const next = Editor.after(editor, selection.anchor, { unit: 'character' });
  return (
    !!next &&
    (Editor.leaf(editor, next)[0] as unknown as HighlightElement).highlight !==
      highlight
  );
};
