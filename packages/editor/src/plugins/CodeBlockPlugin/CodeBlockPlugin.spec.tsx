// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { useMemo } from 'react';
import { Editor, Node, Transforms } from 'slate';
import { Slate } from 'slate-react';
import { afterEach, expect, it } from 'vitest';
import { createEditable } from '../../core/createEditable';
import { createEditor } from '../../core/createEditor';
import { deserialize } from '../../core/deserialize';
import { serialize } from '../../core/serialize';
import { ShortcutsPlugin } from '../ShortcutsPlugin/ShortcutsPlugin';
import { CodeBlockPlugin } from './CodeBlockPlugin';

afterEach(cleanup);

const createInlineCodeEditor = (text = '') => {
  const plugin = new CodeBlockPlugin({ renderCodeBlock: () => null });
  const editor = createEditor([plugin])();
  editor.children = [{ type: 'paragraph', children: [{ text }] }];
  Transforms.select(editor, Editor.end(editor, [0]));
  return { editor, plugin };
};

it('converts backtick-delimited text and continues typing outside inline code', () => {
  const { editor } = createInlineCodeEditor();
  for (const character of 'Use `const answer = 42;`')
    editor.insertText(character);
  editor.insertText(' here');

  expect(editor.children).toEqual([
    {
      type: 'paragraph',
      children: [
        { text: 'Use ' },
        { text: 'const answer = 42;', code: true },
        { text: ' here' },
      ],
    },
  ]);
});

it('preserves surrounding text and existing formatting across text leaves', () => {
  const { editor } = createInlineCodeEditor('Before `one ');
  Editor.addMark(editor, 'bold', true);
  editor.insertText('two');
  Editor.removeMark(editor, 'bold');
  editor.insertText('`');
  editor.insertText(' after');

  expect(editor.children[0].children).toEqual([
    { text: 'Before ' },
    { text: 'one ', code: true },
    { text: 'two', bold: true, code: true },
    { text: ' after' },
  ]);
});

it.each(['`', '``', '```', '``text', '`one\ntwo'])(
  'keeps %j literal',
  (text) => {
    const { editor } = createInlineCodeEditor(text);
    editor.insertText('`');
    expect(editor.children[0].children).toEqual([{ text: `${text}\`` }]);
  },
);

it('converts Unicode text in the middle of a paragraph', () => {
  const { editor } = createInlineCodeEditor('Before `👋 пример after');
  Transforms.select(editor, {
    path: [0, 0],
    offset: 'Before `👋 пример'.length,
  });
  editor.insertText('`');
  expect(editor.children[0].children).toEqual([
    { text: 'Before ' },
    { text: '👋 пример', code: true },
    { text: ' after' },
  ]);
});

it('does not match an opening backtick in a previous paragraph', () => {
  const { editor } = createInlineCodeEditor('`first');
  editor.children.push({ type: 'paragraph', children: [{ text: 'second' }] });
  Transforms.select(editor, Editor.end(editor, [1]));
  editor.insertText('`');
  expect(editor.children[1].children).toEqual([{ text: 'second`' }]);
});

it('replaces selected text with a literal backtick', () => {
  const { editor } = createInlineCodeEditor('`one two');
  Transforms.select(editor, {
    anchor: { path: [0, 0], offset: 5 },
    focus: { path: [0, 0], offset: 8 },
  });
  editor.insertText('`');
  expect(editor.children[0].children).toEqual([{ text: '`one `' }]);
});

it('keeps backticks literal within code blocks', () => {
  const { editor } = createInlineCodeEditor();
  editor.children = [
    {
      type: 'code',
      children: [{ type: 'code-line', children: [{ text: '`value' }] }],
    },
  ];
  Transforms.select(editor, Editor.end(editor, [0]));
  editor.insertText('`');
  expect(Node.string(editor.children[0])).toBe('`value`');
  expect(Node.leaf(editor, [0, 0, 0])).not.toHaveProperty('code');
});

it('preserves the triple-backtick code block shortcut', () => {
  const plugin = new CodeBlockPlugin({ renderCodeBlock: () => null });
  const shortcuts = new ShortcutsPlugin({
    shortcuts: [
      {
        trigger: '`',
        before: /^``$/,
        change(editor) {
          Transforms.delete(editor, { at: Editor.range(editor, [0]) });
          CodeBlockPlugin.toggleCodeBlock(editor);
        },
      },
    ],
  });
  for (const plugins of [
    [shortcuts, plugin],
    [plugin, shortcuts],
  ]) {
    const editor = createEditor(plugins)();
    editor.children = [{ type: 'paragraph', children: [{ text: '' }] }];
    Transforms.select(editor, Editor.start(editor, [0]));
    for (const character of '```') editor.insertText(character);
    expect(editor.children[0].type).toBe('code');
  }
});

it('renders inline code and supports HTML serialization and deserialization', () => {
  const { editor, plugin } = createInlineCodeEditor('`a < b');
  editor.insertText('`');
  const Editable = createEditable(editor, [plugin]);
  const { container } = render(
    <Slate editor={editor} initialValue={editor.children}>
      <Editable />
    </Slate>,
  );
  expect(container.querySelector('code')?.textContent).toBe('a < b');
  expect(serialize([plugin])(editor.children[0])).toBe(
    '<p><code>a &lt; b</code></p>',
  );
  const document = new DOMParser().parseFromString(
    '<p><code>a &lt; b</code></p>',
    'text/html',
  );
  expect(deserialize([plugin])(document.body)).toEqual(editor.children);
});

const renderCodeEditor = () => {
  let selectLanguage: (language: string) => void = () => {
    throw new Error('Expected language menu to render');
  };
  const LanguageMenu = ({
    language,
    onChange,
  }: {
    language: string;
    onChange: (language: string) => void;
  }) => {
    // Match consumers that only rebuild their menu when the language changes.
    // biome-ignore lint/correctness/useExhaustiveDependencies: reproduce the existing language menu
    selectLanguage = useMemo(() => onChange, [language]);
    return null;
  };
  const plugin = new CodeBlockPlugin({
    renderCodeBlock: (language, onChange, { Content }) => (
      <>
        <LanguageMenu language={language} onChange={onChange} />
        <Content />
      </>
    ),
  });
  const editor = createEditor([plugin])();
  const Editable = createEditable(editor, [plugin]);
  render(
    <Slate
      editor={editor}
      initialValue={[
        {
          type: 'code',
          children: [{ type: 'code-line', children: [{ text: '' }] }],
        },
      ]}
    >
      <Editable />
    </Slate>,
  );

  return {
    editor,
    selectLanguage: (language: string) => selectLanguage(language),
  };
};

it('changes language after typing when the language menu memoizes its items', async () => {
  const { editor, selectLanguage } = renderCodeEditor();

  await act(async () => {
    Transforms.select(editor, { path: [0, 0, 0], offset: 0 });
    editor.insertText('const answer = 42;');
  });

  await act(async () => {
    expect(() => selectLanguage('typescript')).not.toThrow();
  });

  expect(editor.children[0]).toMatchObject({ language: 'typescript' });
  expect(Node.string(editor.children[0])).toBe('const answer = 42;');

  await act(async () => {
    editor.insertText('\nconsole.log(answer);');
  });
  const selection = editor.selection;
  await act(async () => selectLanguage('javascript'));

  expect(editor.children[0]).toMatchObject({ language: 'javascript' });
  expect(Node.string(editor.children[0])).toBe(
    'const answer = 42;\nconsole.log(answer);',
  );
  expect(editor.selection).toEqual(selection);
});

it('allows choosing a language before typing', async () => {
  const { editor, selectLanguage } = renderCodeEditor();

  await act(async () => selectLanguage('python'));
  await act(async () => {
    Transforms.select(editor, { path: [0, 0, 0], offset: 0 });
    editor.insertText('print(42)');
  });

  expect(editor.children[0]).toMatchObject({ language: 'python' });
  expect(Node.string(editor.children[0])).toBe('print(42)');
});

it('updates the current block path after a preceding block is inserted', async () => {
  const { editor, selectLanguage } = renderCodeEditor();

  await act(async () => {
    Transforms.select(editor, { path: [0, 0, 0], offset: 0 });
    editor.insertText('SELECT 42;');
  });
  await act(async () => {
    Transforms.insertNodes(
      editor,
      { type: 'paragraph', children: [{ text: 'Before code' }] },
      { at: [0] },
    );
  });
  await act(async () => selectLanguage('sql'));

  expect(editor.children[0]).not.toHaveProperty('language');
  expect(editor.children[1]).toMatchObject({ language: 'sql' });
  expect(Node.string(editor.children[1])).toBe('SELECT 42;');
});
