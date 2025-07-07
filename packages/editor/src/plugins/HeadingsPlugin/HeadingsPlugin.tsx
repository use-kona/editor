import { Descendant, Editor, Element, Transforms } from 'slate';
import { jsx } from 'slate-hyperscript';
import type { RenderElementProps } from 'slate-react';
import type { IPlugin } from '../../types';

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
      deserialize: (element: HTMLElement, children) => {
        const { nodeName } = element;

        if (nodeName === 'H1') {
          return jsx(
            'element',
            { type: HeadingsPlugin.HeadingLevel1 },
            children,
          );
        }
      },
      serialize: (node: Descendant, children) => {
        if (
          Element.isElement(node) &&
          node.type === HeadingsPlugin.HeadingLevel1
        ) {
          return `<h1>${children}</h1>`;
        }
      },
    },
    {
      type: HeadingsPlugin.HeadingLevel2,
      render: (props: RenderElementProps) => {
        return <h2 {...props.attributes}>{props.children}</h2>;
      },
      deserialize: (element: HTMLElement, children) => {
        const { nodeName } = element;

        if (nodeName === 'H2') {
          return jsx(
            'element',
            { type: HeadingsPlugin.HeadingLevel2 },
            children,
          );
        }
      },
      serialize: (node: Descendant, children) => {
        if (
          Element.isElement(node) &&
          node.type === HeadingsPlugin.HeadingLevel2
        ) {
          return `<h2>${children}</h2>`;
        }
      },
    },
    {
      type: HeadingsPlugin.HeadingLevel3,
      render: (props: RenderElementProps) => {
        return <h3 {...props.attributes}>{props.children}</h3>;
      },
      deserialize: (element: HTMLElement, children) => {
        const { nodeName } = element;

        if (nodeName === 'H3') {
          return jsx(
            'element',
            { type: HeadingsPlugin.HeadingLevel3 },
            children,
          );
        }
      },
      serialize: (node: Descendant, children) => {
        if (
          Element.isElement(node) &&
          node.type === HeadingsPlugin.HeadingLevel3
        ) {
          return `<h3>${children}</h3>`;
        }
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
