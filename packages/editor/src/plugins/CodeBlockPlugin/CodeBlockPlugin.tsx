import Prism from 'prismjs';
import type { KeyboardEvent } from 'react';
import {
  type DecoratedRange,
  Editor,
  Element,
  Node,
  type NodeEntry,
  Transforms,
} from 'slate';
import {
  ReactEditor,
  type RenderElementProps,
  type RenderLeafProps,
} from 'slate-react';
import type { IPlugin } from '../../types';
import { CodeBlock } from './CodeBlock';
import type { CodeElement } from './types';
import { normalizeTokens } from './utils';
import 'prismjs/themes/prism.css';
import type { CustomElement } from '../../../types';
import { CodeBlockLine } from './CodeBlockLine';

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

type Options = {
  renderLanguageSelector: (
    value: string,
    onChange: (value: string) => void,
    params: {
      element: CodeElement;
    },
  ) => React.ReactNode;
};

export class CodeBlockPlugin implements IPlugin {
  constructor(private options: Options) {}

  static CODE_ELEMENT = 'code';
  static CODE_LINE_ELEMENT = 'code-line';

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
          editor.insertText('    ');
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
            !Editor.isEditor(n) &&
            Element.isElement(n) &&
            n.type === CodeBlockPlugin.CODE_ELEMENT,
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
      render: (props: RenderElementProps, editor: Editor) => {
        const onChange = (language: string) => {
          const path = ReactEditor.findPath(editor, props.element);
          Transforms.setNodes<CodeElement>(editor, { language }, { at: path });
        };

        return (
          <CodeBlock
            {...props}
            element={props.element as CodeElement}
            renderLanguageSelector={(element) =>
              this.options.renderLanguageSelector(
                (props.element as CodeElement).language,
                onChange,
                {
                  element: element as CodeElement,
                },
              )
            }
          />
        );
      },
    },
    {
      type: CodeBlockPlugin.CODE_LINE_ELEMENT,
      render: (props: RenderElementProps) => {
        return <CodeBlockLine {...props} />;
      },
    },
  ];

  leafs = [
    {
      render: (props: RenderLeafProps) => {
        const { leaf, attributes, children } = props;
        const { text, ...rest } = leaf;

        return (
          <span {...attributes} className={Object.keys(rest).join(' ')}>
            {children}
          </span>
        );
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
    Editor.withoutNormalizing(editor, () => {
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
            match: (n) =>
              Editor.isBlock(editor, n as CustomElement) &&
              (n as CustomElement).type === 'paragraph',
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
            match: (n) =>
              (n as CustomElement).type === CodeBlockPlugin.CODE_LINE_ELEMENT,
          },
        );
      }
    });
  };
}
