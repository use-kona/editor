// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { useMemo } from 'react';
import { Node, Transforms } from 'slate';
import { Slate } from 'slate-react';
import { afterEach, expect, it } from 'vitest';
import { createEditable } from '../../core/createEditable';
import { createEditor } from '../../core/createEditor';
import { CodeBlockPlugin } from './CodeBlockPlugin';

afterEach(cleanup);

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
