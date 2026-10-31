import { Editor, Transforms } from 'slate';
import {type ChangeMatch, CodeBlockPlugin, HeadingsPlugin, ListsPlugin, type Shortcut} from '@use-kona/editor';

export const getShortcuts = (): Shortcut[] => {
  return [

    // bold
    {
      trigger: ' ',
      before: /\*\*/g,
      after: /\*\*/g,
      change(editor: Editor, match) {
        replaceWithMarkedText(editor, match, 'bold');
      },
    },
    // italic
    {
      trigger: ' ',
      before: /_/g,
      after: /_/g,
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
      trigger: '`',
      before: /``/g,
      change(editor: Editor, match) {
        replaceWithCodeBlock(editor, match);
      }
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
    // Bulleted list
    {
      trigger: ' ',
      before: /\*/g,
      change(editor: Editor, match) {
        replaceWithList(editor, match, ListsPlugin.BULLETED_LIST_ELEMENT);
      }
    },
    // Numbered list
    {
      trigger: ' ',
      before: /\d+\./g,
      change(editor: Editor, match) {
        replaceWithList(editor, match, ListsPlugin.NUMBERED_LIST_ELEMENT);
      }
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

const replaceWithList = (
  editor: Editor,
  match: ChangeMatch,
  listType: string,
) => {
  Editor.withoutNormalizing(editor, () => {
    if (!editor.selection) {
      return;
    }

    Transforms.delete(editor, {
      at: editor.selection?.focus,
      distance: (match.before?.[0].length || 0),
      reverse: true,
      unit: 'character',
    });

    Transforms.setNodes(editor, {
      type: ListsPlugin.LIST_ITEM_ELEMENT,
    });

    Transforms.wrapNodes(editor, {
      type: listType,
      children: []
    });
  })
}

const replaceWithCodeBlock = (
  editor: Editor,
  match: ChangeMatch,
) => {
  Editor.withoutNormalizing(editor, () => {
    if (!editor.selection) {
      return;
    }

    Transforms.delete(editor, {
      at: editor.selection?.focus,
      distance: (match.before?.[0].length || 0),
      reverse: true,
      unit: 'character',
    });

    Transforms.setNodes(editor, {
      type: CodeBlockPlugin.CODE_LINE_ELEMENT,
    });

    Transforms.wrapNodes(editor, {
      type: CodeBlockPlugin.CODE_ELEMENT,
      children: []
    });
  })
}
