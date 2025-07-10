import { Editor, Node, Range } from 'slate';
import type { CustomElement } from '../../../types';
import type { IPlugin } from '../../types';

type Options = {
  shortcuts: Shortcut[];
  ignoreNodes?: string[];
};

export type Shortcut = {
  trigger: string;
  before?: RegExp;
  after?: RegExp;
  change(editor: Editor, match: ChangeMatch): void;
};

export type ChangeMatch = {
  before?: RegExpExecArray;
  after?: RegExpExecArray;
  text?: string;
  cleanText?: string;
};

export class ShortcutsPlugin implements IPlugin {
  constructor(private options: Options) {}

  init(editor: Editor) {
    const { insertText } = editor;

    editor.insertText = (text: string) => {
      const { selection } = editor;

      if (!selection) {
        return;
      }

      const entry = Editor.above<CustomElement>(editor, {
        at: selection,
        mode: 'highest',
        match: (n) => !Editor.isEditor(n),
      });

      if (!entry) {
        return insertText(text);
      }

      const [node] = entry;

      if (this.options.ignoreNodes?.includes(node.type)) {
        insertText(text);
        return;
      }

      for (const shortcut of this.options.shortcuts) {
        if (Range.isCollapsed(selection)) {
          if (text === shortcut.trigger) {
            let matchBefore: RegExpExecArray | null = null;
            let matchAfter: RegExpExecArray | null = null;

            if (shortcut.before) {
              // Get the text in the current block before the cursor
              const currentPoint = Range.start(selection);
              const [currentNode] = Editor.node(editor, currentPoint.path);
              const textBeforeCursor = Node.string(currentNode).slice(
                0,
                currentPoint.offset,
              );

              // Check if the text before cursor matches the pattern
              matchBefore = new RegExp(`${shortcut.before.source}`, 'g').exec(
                textBeforeCursor,
              );
            }

            if (shortcut.after && matchBefore) {
              // Get the text in the current block after the cursor
              const currentPoint = Range.start(selection);
              const [currentNode] = Editor.node(editor, currentPoint.path);
              const textBetweenMatches = Node.string(currentNode).slice(
                matchBefore.index + matchBefore[0].length,
                currentPoint.offset,
              );

              // Check if the text between matches matches the pattern
              matchAfter = new RegExp(shortcut.after.source + '$', 'g').exec(
                textBetweenMatches,
              );
            }

            if (matchBefore && !shortcut.after) {
              shortcut.change(editor, {
                before: matchBefore,
              });
              return;
            }

            if (matchAfter && !shortcut.before) {
              shortcut.change(editor, {
                after: matchAfter,
              });
              return;
            }

            if (
              matchBefore &&
              matchAfter &&
              shortcut.before &&
              shortcut.after
            ) {
              shortcut.change(editor, {
                before: matchBefore,
                after: matchAfter,
                text: matchBefore.input.slice(matchBefore.index),
                cleanText: matchBefore.input.slice(
                  matchBefore.index + matchBefore[0].length,
                  matchBefore.input.length - matchAfter[0].length,
                ),
              });
              return;
            }
          }
        }
      }

      insertText(text);
    };

    return editor;
  }
}
