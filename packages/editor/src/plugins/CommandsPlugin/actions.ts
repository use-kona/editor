import { type Editor, type Selection, Transforms } from 'slate';
import type { CustomElement } from '../../../types';

export const removeCommand =
  (editor: Editor, selection: Selection, filter?: string | boolean) => () => {
    Transforms.delete(editor, {
      at: selection?.focus,
      distance: typeof filter === 'string' ? filter.length + 1 : 1,
      reverse: true,
      unit: 'character',
    });
  };

export const set =
  (editor: Editor, selection: Selection, filter?: string | boolean) =>
  (params: Partial<CustomElement>, options = {}) => {
    removeCommand(editor, selection, filter)();
    Transforms.setNodes(editor, params, {
      ...options,
    });
  };

export const insert =
  (editor: Editor, selection: Selection, filter?: string | boolean) =>
  (params: CustomElement | CustomElement[]) => {
    removeCommand(editor, selection, filter)();
    Transforms.insertNodes(editor, params);
  };

export const wrap =
  (editor: Editor, selection: Selection, filter?: string | boolean) =>
  (params: CustomElement, options = {}) => {
    removeCommand(editor, selection, filter)();
    Transforms.wrapNodes(editor, params, {
      ...options,
    });
  };

export const insertText = (editor: Editor) => (text: string) => {
  Transforms.insertText(editor, text);
};
