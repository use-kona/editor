import { Editor, Transforms } from 'slate';
import { type ChangeMatch, HeadingsPlugin, type Shortcut } from '../plugins';

export const getShortcuts = (): Shortcut[] => {
  return [
    {
      trigger: ' ',
      before: /\*\*/g,
      after: /\*\*/g,
      change(editor: Editor, match) {
        replaceWithMarkedText(editor, match, 'bold');
      },
    },
    {
      trigger: ' ',
      before: /\*/g,
      after: /\*/g,
      change(editor: Editor, match) {
        replaceWithMarkedText(editor, match, 'italic');
      },
    },
    {
      trigger: ' ',
      before: /~~/g,
      after: /~~/g,
      change(editor: Editor, match) {
        replaceWithMarkedText(editor, match, 'strikethrough');
      },
    },
    {
      trigger: ' ',
      before: /^###/g,
      change(editor, match) {
        replaceWithHeading(editor, match, HeadingsPlugin.HeadingLevel3);
      },
    },
    {
      trigger: ' ',
      before: /^##/g,
      change(editor, match) {
        replaceWithHeading(editor, match, HeadingsPlugin.HeadingLevel2);
      },
    },
    {
      trigger: ' ',
      before: /^#/g,
      change(editor, match) {
        replaceWithHeading(editor, match, HeadingsPlugin.HeadingLevel1);
      },
    },
  ];
};

const replaceWithHeading = (
  editor: Editor,
  match: ChangeMatch,
  type: string,
) => {
  Editor.withoutNormalizing(editor, () => {
    const { selection } = editor;

    if (selection) {
      Transforms.delete(editor, {
        at: selection.focus,
        distance: match.before?.[0].length,
        reverse: true,
        unit: 'character',
      });

      Transforms.setNodes(editor, {
        type,
      });
    }
  });
};

const replaceWithMarkedText = (
  editor: Editor,
  match: ChangeMatch,
  mark: string,
) => {
  Editor.withoutNormalizing(editor, () => {
    if (!editor.selection) {
      return;
    }

    Transforms.delete(editor, {
      at: editor.selection?.focus,
      distance: match.text?.length || 0,
      reverse: true,
      unit: 'character',
    });
    Transforms.insertText(editor, match.cleanText || '');
    Transforms.setSelection(editor, {
      anchor: editor.selection?.focus,
      focus: {
        path: editor.selection?.focus.path,
        offset: editor.selection?.focus.offset - (match.cleanText?.length || 0),
      },
    });
    Editor.addMark(editor, mark, true);
    Transforms.setSelection(editor, {
      anchor: editor.selection.anchor,
      focus: editor.selection.anchor,
    });
  });
};
