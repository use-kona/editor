import { Editor, Element, Transforms } from 'slate';
import { RenderElementProps } from 'slate-react';
import { IPlugin } from '../../types';

export class HeadingsPlugin implements IPlugin {
  static HeadingLevel1 = 'h1';
  static HeadingLevel2 = 'h2';
  static HeadingLevel3 = 'h3';

  blocks = [
    {
      type: HeadingsPlugin.HeadingLevel1,
      render: (props: RenderElementProps) => {
        return <h1 {...props.attributes}>{props.children}</h1>;
      },
    },
    {
      type: HeadingsPlugin.HeadingLevel2,
      render: (props: RenderElementProps) => {
        return <h2 {...props.attributes}>{props.children}</h2>;
      },
    },
    {
      type: HeadingsPlugin.HeadingLevel3,
      render: (props: RenderElementProps) => {
        return <h3 {...props.attributes}>{props.children}</h3>;
      },
    },
  ];

  static isHeading1Active(editor: Editor) {
    return isBlockActive(editor, HeadingsPlugin.HeadingLevel1);
  }

  static isHeading2Active(editor: Editor) {
    return isBlockActive(editor, HeadingsPlugin.HeadingLevel2);
  }

  static isHeading3Active(editor: Editor) {
    return isBlockActive(editor, HeadingsPlugin.HeadingLevel3);
  }

  private static toggleHeading(editor: Editor, type: string) {
    const isActive = isBlockActive(editor, type);
    Transforms.setNodes(editor, { type: isActive ? 'paragraph' : type });
  }

  static toggleHeading1(editor: Editor) {
    HeadingsPlugin.toggleHeading(editor, HeadingsPlugin.HeadingLevel1);
  }

  static toggleHeading2(editor: Editor) {
    HeadingsPlugin.toggleHeading(editor, HeadingsPlugin.HeadingLevel2);
  }

  static toggleHeading3(editor: Editor) {
    HeadingsPlugin.toggleHeading(editor, HeadingsPlugin.HeadingLevel3);
  }
}

const isBlockActive = (editor, type) => {
  const { selection } = editor;

  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (node) =>
        !Editor.isEditor(node) && Element.isElement(node) && node.type === type,
    }),
  );

  return !!match;
};
