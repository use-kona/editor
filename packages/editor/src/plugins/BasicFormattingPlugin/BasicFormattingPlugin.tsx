import { Editor } from 'slate';
import { jsx } from 'slate-hyperscript';
import type { CustomElement, CustomText } from '../../../types';
import type { IPlugin } from '../../types';

type CustomLeaf = CustomText & {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
};

export class BasicFormattingPlugin
  implements IPlugin<Editor, CustomElement, CustomLeaf>
{
  hotkeys = [
    ['cmd+b', (_, editor) => BasicFormattingPlugin.toggleBold(editor)] as const,
    [
      'ctrl+b',
      (_, editor) => BasicFormattingPlugin.toggleBold(editor),
    ] as const,

    [
      'cmd+i',
      (_, editor) => BasicFormattingPlugin.toggleItalic(editor),
    ] as const,
    [
      'ctrl+i',
      (_, editor) => BasicFormattingPlugin.toggleItalic(editor),
    ] as const,

    [
      'cmd+u',
      (_, editor) => BasicFormattingPlugin.toggleUnderline(editor),
    ] as const,
    [
      'ctrl+u',
      (_, editor) => BasicFormattingPlugin.toggleUnderline(editor),
    ] as const,
  ];

  leafs: IPlugin<Editor, CustomElement, CustomLeaf>['leafs'] = [
    {
      render: (props) => {
        const { leaf, attributes, children } = props;

        let content = children;

        if (leaf.bold) {
          content = <strong>{content}</strong>;
        }

        if (leaf.italic) {
          content = <em>{content}</em>;
        }

        if (leaf.underline) {
          content = <u>{content}</u>;
        }

        if (leaf.strikethrough) {
          content = <s>{content}</s>;
        }

        return <span {...attributes}>{content}</span>;
      },
      deserialize: (element: HTMLElement, children) => {
        const { nodeName } = element;

        let attrs: Record<string, boolean> | null = null;
        switch (nodeName) {
          case 'EM':
          case 'I': {
            attrs = { italic: true };
            break;
          }
          case 'STRONG': {
            attrs = { bold: true };
            break;
          }
          case 'U': {
            attrs = { underline: true };
            break;
          }
          case 'S': {
            attrs = { strikethrough: true };
            break;
          }
        }

        if (attrs) {
          return children?.map((child) => jsx('text', attrs, child));
        }

        return undefined;
      },
    },
  ];

  static isMarkActive(editor: Editor, mark: keyof CustomLeaf) {
    const marks: Record<string, boolean> | null = Editor.marks(editor);

    return marks ? marks[mark] === true : false;
  }

  static toggleMark(editor: Editor, mark: keyof CustomLeaf) {
    const isActive = BasicFormattingPlugin.isMarkActive(editor, mark);

    if (isActive) {
      editor.removeMark(mark);
    } else {
      editor.addMark(mark, true);
    }
  }

  static toggleBold(editor: Editor) {
    BasicFormattingPlugin.toggleMark(editor, 'bold');
  }

  static toggleItalic(editor: Editor) {
    BasicFormattingPlugin.toggleMark(editor, 'italic');
  }

  static toggleUnderline(editor: Editor) {
    BasicFormattingPlugin.toggleMark(editor, 'underline');
  }

  static toggleStrikethrough(editor: Editor) {
    BasicFormattingPlugin.toggleMark(editor, 'strikethrough');
  }
}
