import type { KeyboardEvent } from 'react';
import { Editor, Transforms } from 'slate';
import type { CustomElement } from '../../../types';
import type { IPlugin } from '../../types';

type Options = {
  breakNodes: string[];
};

export class BreaksPlugin implements IPlugin {
  constructor(private options: Options) {}

  init(editor: Editor) {
    const { insertBreak } = editor;

    editor.insertBreak = () => {
      const node = Editor.above<CustomElement>(editor, {
        match: (n) => Editor.isBlock(editor, n as CustomElement),
        mode: 'lowest',
      });

      if (!node) {
        insertBreak();
        return;
      }

      const [element, path] = node;

      const { selection } = editor;
      if (!selection) {
        insertBreak();
        return;
      }

      if (this.options.breakNodes.includes(element.type)) {
        const { anchor } = selection;

        const isStart = Editor.isStart(editor, anchor, path);

        if (isStart) {
          Transforms.insertNodes(editor, {
            type: 'paragraph',
            children: [{ text: '' }],
          });
          Transforms.move(editor);
          return;
        } else {
          insertBreak();

          Transforms.setNodes(editor, {
            type: 'paragraph',
          });
        }
      } else {
        insertBreak();
      }
    };

    return editor;
  }

  handlers = {
    onKeyDown: (event: KeyboardEvent, editor: Editor) => {
      if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault();
        editor.insertText('\n');
      }
    },
  };
}
