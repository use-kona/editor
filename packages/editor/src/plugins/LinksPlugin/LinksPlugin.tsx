import isUrl from 'is-url';
import { Editor, Element, Range, Transforms } from 'slate';
import { jsx } from 'slate-hyperscript';
import type { RenderElementProps } from 'slate-react';
import type { IPlugin } from '../../types';
import { LINK_ELEMENT } from './constants';
import { Link } from './Link';
import type { LinkElement, Options } from './types';

export class LinksPlugin implements IPlugin {
  static LINK_TYPE = LINK_ELEMENT;

  constructor(private options: Options) {}

  init(editor: Editor) {
    const { insertText } = editor;

    editor.insertText = (text: string) => {
      if (text && isUrl(text)) {
        const selectedText = window.getSelection()?.toString();
        if (selectedText) {
          Transforms.wrapNodes(editor, {
            type: LinksPlugin.LINK_TYPE,
            url: text,
            children: [{ text: selectedText }],
          } as LinkElement);
        } else {
          Transforms.insertNodes(editor, {
            type: LinksPlugin.LINK_TYPE,
            url: text,
            children: [{ text }],
          } as LinkElement);
        }
        Transforms.move(editor, {
          unit: 'offset',
        });
      } else {
        insertText(text);
      }
    };

    return editor;
  }

  blocks = [
    {
      isInline: true,
      type: LinksPlugin.LINK_TYPE,
      render: (props: RenderElementProps) => {
        return (
          <Link
            {...props}
            element={props.element as LinkElement}
            renderHint={this.options.renderHint}
          />
        );
      },
      serialize: (element, children) => {
        if (
          Element.isElement(element) &&
          element.type === LinksPlugin.LINK_TYPE
        ) {
          return `<a href="${(element as LinkElement).url}">${children}</a>`;
        }
      },
      deserialize: (element: HTMLElement, children) => {
        if (element.tagName === 'A') {
          const url = element.getAttribute('href') || '';
          return jsx(
            'element',
            {
              type: LinksPlugin.LINK_TYPE,
              url,
            },
            children,
          );
        }
      },
    },
  ];

  static addLink = (editor: Editor, url: string) => {
    const { selection } = editor;

    if (!selection) {
      return;
    }

    const isCollapsed = selection && Range.isCollapsed(selection);

    const [link] = Array.from(
      Editor.nodes(editor, {
        match: (n) => Element.isElement(n) && n.type === LinksPlugin.LINK_TYPE,
        at: selection,
      }),
    );

    if (link) {
      Transforms.setNodes(
        editor,
        {
          type: LinksPlugin.LINK_TYPE,
          url,
        } as LinkElement,
        {
          at: link[1],
          match: (n) =>
            Element.isElement(n) && n.type === LinksPlugin.LINK_TYPE,
        },
      );
    } else if (isCollapsed) {
      Transforms.insertNodes(editor, {
        type: LinksPlugin.LINK_TYPE,
        url,
        children: [{ text: url }],
      } as LinkElement);
      Transforms.move(editor, {
        unit: 'offset',
      });
    } else {
      Transforms.wrapNodes(
        editor,
        {
          type: LinksPlugin.LINK_TYPE,
          url,
        } as LinkElement,
        {
          split: true,
        },
      );
      Transforms.move(editor, {
        unit: 'offset',
      });
    }
  };

  static removeLink = (editor: Editor) => {
    const [link] = Array.from(
      Editor.nodes(editor, {
        match: (n) => Element.isElement(n) && n.type === LinksPlugin.LINK_TYPE,
      }),
    );

    if (link) {
      Transforms.unwrapNodes(editor, {
        match: (n) => Element.isElement(n) && n.type === LinksPlugin.LINK_TYPE,
      });
    }
  };
}
