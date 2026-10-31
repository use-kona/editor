import escapeHtml from 'escape-html';
import Prism from 'prismjs';
import { type KeyboardEvent, type ReactNode, useCallback, useRef } from 'react';
import {
  type DecoratedRange,
  Editor,
  Element,
  Node,
  type NodeEntry,
  type Point,
  Range,
  Text,
  Transforms,
} from 'slate';
import { ReactEditor, type RenderElementProps } from 'slate-react';
import type { IPlugin } from '../../types';
import { CodeBlock } from './CodeBlock';
import type { CodeElement } from './types';
import { normalizeTokens } from './utils';
import 'prismjs/themes/prism.css';
import type { CustomElement, CustomText } from '../../../types';
import { CodeBlockLine } from './CodeBlockLine';
import styles from './styles.module.css';

// Import all supported languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markup'; // HTML, XML, SVG
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import { jsx } from 'slate-hyperscript';

type Options = {
  renderCodeBlock: (
    language: string,
    onChange: (language: string) => void,
    params: {
      Content: () => ReactNode;
      element: CodeElement;
    },
  ) => React.ReactNode;
};

type CodeLeaf = CustomText & { code?: boolean };

const CodeBlockRenderer = ({
  editor,
  renderCodeBlock,
  ...props
}: RenderElementProps & Options & { editor: Editor }) => {
  const element = props.element as CodeElement;
  const elementRef = useRef(element);
  elementRef.current = element;

  // Menus can retain this callback while Slate replaces nodes as text is edited.
  const onChange = useCallback(
    (language: string) => {
      const path = ReactEditor.findPath(editor, elementRef.current);
      Transforms.setNodes<CodeElement>(editor, { language }, { at: path });
    },
    [editor],
  );
  // biome-ignore lint/correctness/noNestedComponentDefinitions: renderCodeBlock expects a Content component bound to these Slate render props
  const Content = (): ReactNode => <CodeBlock {...props} element={element} />;

  return (
    <>{renderCodeBlock(element.language, onChange, { element, Content })}</>
  );
};

export class CodeBlockPlugin
  implements IPlugin<Editor, CustomElement, CodeLeaf>
{
  constructor(private options: Options) {}

  static CODE_ELEMENT = 'code';
  static CODE_LINE_ELEMENT = 'code-line';

  init(editor: Editor) {
    const { insertText } = editor;

    editor.insertText = (text) => {
      const { selection } = editor;
      if (
        text !== '`' ||
        !selection ||
        !Range.isCollapsed(selection) ||
        CodeBlockPlugin.isCodeBlockActive(editor) ||
        (Editor.marks(editor) as Omit<CodeLeaf, 'text'> | null)?.code
      ) {
        return insertText(text);
      }

      const block = Editor.above(editor, {
        match: (node) =>
          Element.isElement(node) && Editor.isBlock(editor, node),
      });
      if (!block) return insertText(text);

      const beforeRange = {
        anchor: Editor.start(editor, block[1]),
        focus: selection.anchor,
      };
      const before = Editor.string(editor, beforeRange);
      // Only match a single opening backtick with nonempty, single-line content.
      const match = /(?:^|[^`])`([^`\n]+)$/.exec(before);
      if (!match) return insertText(text);

      let offset = before.length - match[1].length - 1;
      let start: Point | undefined;
      for (const [node, path] of Editor.nodes(editor, {
        at: beforeRange,
        match: Text.isText,
      })) {
        if (!Text.isText(node)) continue;
        if (offset < node.text.length) {
          start = { path, offset };
          break;
        }
        offset -= node.text.length;
      }
      if (!start) return insertText(text);

      const opening = start;
      const marks = Editor.marks(editor);

      Editor.withoutNormalizing(editor, () => {
        Transforms.select(editor, { anchor: opening, focus: selection.anchor });
        Transforms.delete(editor, {
          at: {
            anchor: opening,
            focus: { ...opening, offset: opening.offset + 1 },
          },
        });
        Editor.addMark(editor, 'code', true);
        Transforms.collapse(editor, { edge: 'end' });
        // Continue with the formatting active before the shortcut ran.
        editor.marks = { ...marks };
      });
    };

    return editor;
  }

  handlers = {
    onKeyDown: (event: KeyboardEvent, editor: Editor) => {
      const entry = Editor.above<CustomElement>(editor, {
        match: (n) =>
          !Editor.isEditor(n) && Editor.isBlock(editor, n as CustomElement),
        mode: 'highest',
      });

      if (!entry) {
        return;
      }

      const [node] = entry;

      if (event.key === 'Tab' && node.type === CodeBlockPlugin.CODE_ELEMENT) {
        event.preventDefault();

        if (!event.shiftKey) {
          editor.insertText('  ');
        } else {
          const { selection } = editor;
          if (selection && selection.anchor.offset === selection.focus.offset) {
            const [line] = Editor.node(editor, selection.anchor.path);
            const text = Node.string(line);
            const cursorPos = selection.anchor.offset;

            // Check if there are 4 spaces before cursor
            if (
              cursorPos >= 4 &&
              text.substring(cursorPos - 4, cursorPos) === '    '
            ) {
              editor.delete({ unit: 'character', distance: 4, reverse: true });
            }
            // Check for 4 spaces at the beginning of the line
            else if (text.startsWith('    ')) {
              const path = selection.anchor.path;
              const start = { path, offset: 0 };
              const end = { path, offset: 4 };
              editor.delete({ at: { anchor: start, focus: end } });
            }
          }
        }
      }

      // Handle Ctrl+A to select all text within the code block
      if (
        event.key === 'a' &&
        (event.ctrlKey || event.metaKey) &&
        node &&
        node.type === CodeBlockPlugin.CODE_ELEMENT
      ) {
        event.preventDefault();

        // Find the code block node and its path
        const entry = Editor.above(editor, {
          match: (n) =>
            Element.isElement(n) && n.type === CodeBlockPlugin.CODE_ELEMENT,
        });

        if (entry) {
          const [, codeBlockPath] = entry;
          // Create a range that encompasses all content in the code block
          const start = Editor.start(editor, codeBlockPath);
          const end = Editor.end(editor, codeBlockPath);

          // Set the selection to cover the entire code block content
          Transforms.select(editor, {
            anchor: start,
            focus: end,
          });
        }
      }
    },
  };

  decorate(entry: NodeEntry) {
    const [block, blockPath] = entry;

    if (
      !Element.isElement(block) ||
      block.type !== CodeBlockPlugin.CODE_ELEMENT
    ) {
      return [];
    }

    const language = (block as CodeElement).language || 'plaintext';

    const text = block.children
      .map((line: Node) => Node.string(line))
      .join('\n');
    const prismLanguage =
      Prism.languages[language] || Prism.languages.javascript || {};
    const tokens = Prism.tokenize(text, prismLanguage);
    const normalizedTokens = normalizeTokens(tokens); // make tokens flat and grouped by line
    const decorations: (DecoratedRange & { token: boolean })[] = [];

    for (let index = 0; index < normalizedTokens.length; index++) {
      const tokens = normalizedTokens[index];

      let start = 0;
      for (const token of tokens) {
        const length = token.content.length;
        if (!length) {
          continue;
        }

        const end = start + length;

        const path = [...blockPath, index, 0];

        decorations.push({
          anchor: { path, offset: start },
          focus: { path, offset: end },
          token: true,
          ...Object.fromEntries(token.types.map((type) => [type, true])),
        });

        start = end;
      }
    }

    return decorations;
  }

  blocks = [
    {
      type: CodeBlockPlugin.CODE_ELEMENT,
      render: (props: RenderElementProps, editor: Editor) => (
        <CodeBlockRenderer {...props} {...this.options} editor={editor} />
      ),
      deserialize: (el: HTMLElement, children) => {
        const { nodeName } = el;

        if (nodeName === 'PRE') {
          const lines = children
            .join('')
            .split('\n')
            .filter((line) => Boolean(line));

          return jsx(
            'element',
            { type: CodeBlockPlugin.CODE_ELEMENT },
            lines.map((line) =>
              jsx('element', { type: CodeBlockPlugin.CODE_LINE_ELEMENT }, line),
            ),
          );
        }
      },
    },
    {
      type: CodeBlockPlugin.CODE_LINE_ELEMENT,
      render: (props: RenderElementProps) => {
        return <CodeBlockLine {...props} />;
      },
    },
  ];

  leafs: IPlugin<Editor, CustomElement, CodeLeaf>['leafs'] = [
    {
      render: (props) => {
        const { leaf, attributes, children } = props;
        const { text: _text, code, ...rest } = leaf;

        return (
          <span {...attributes} className={Object.keys(rest).join(' ')}>
            {code ? (
              <code className={styles.inlineCode}>{children}</code>
            ) : (
              children
            )}
          </span>
        );
      },
      serialize: (node) => {
        if (Text.isText(node) && (node as CodeLeaf).code) {
          return `<code>${escapeHtml(node.text)}</code>`;
        }
      },
      deserialize: (element, children) => {
        if (element.nodeName === 'CODE' && !element.closest('pre')) {
          return children?.map((child) => jsx('text', { code: true }, child));
        }
      },
    },
  ];

  static isCodeBlockActive(editor: Editor) {
    const [match] = Array.from(
      Editor.nodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) &&
          (n as CustomElement).type === CodeBlockPlugin.CODE_ELEMENT,
        mode: 'highest',
      }),
    );

    return !!match;
  }

  static toggleCodeBlock = (editor: Editor) => {
    if (!editor.selection) {
      return;
    }

    const node = Editor.above<CustomElement>(editor, {
      match: (n) =>
        !Editor.isEditor(n) &&
        (n as CustomElement).type === CodeBlockPlugin.CODE_ELEMENT,
      mode: 'highest',
    });

    if (node) {
      Transforms.setNodes(
        editor,
        { type: 'paragraph' },
        {
          at: node[1],
          match: (n) =>
            (n as CustomElement).type === CodeBlockPlugin.CODE_LINE_ELEMENT,
          mode: 'lowest',
        },
      );
      Transforms.unwrapNodes(editor, {
        at: node[1],
        match: (n) =>
          (n as CustomElement).type === CodeBlockPlugin.CODE_ELEMENT,
        split: true,
      });
    } else {
      Transforms.setNodes(
        editor,
        {
          type: CodeBlockPlugin.CODE_LINE_ELEMENT,
          children: [{ text: '' }],
        },
        {
          mode: 'lowest',
        },
      );

      Transforms.wrapNodes(
        editor,
        {
          type: CodeBlockPlugin.CODE_ELEMENT,
          language: 'javascript',
          children: [],
        } as CodeElement,
        {
          mode: 'highest',
          match: (n) =>
            (n as CustomElement).type === CodeBlockPlugin.CODE_LINE_ELEMENT,
          at: editor.selection.focus,
        },
      );
    }
  };
}
