// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { Editor, Transforms } from 'slate';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEditor } from '../../core/createEditor';
import { KonaEditor } from '../../editor';
import { BasicFormattingPlugin } from '../BasicFormattingPlugin';
import { HeadingsPlugin } from '../HeadingsPlugin';
import { EmojiPlugin } from './EmojiPlugin';

afterEach(cleanup);

const setup = (text: string, offset = 0) => {
  const onSearch = vi.fn();
  const plugin = new EmojiPlugin({
    onSearch,
    renderMenu: () => null,
    renderEmoji: () => null,
  });
  const editor = createEditor([plugin])();
  editor.children = [{ type: 'paragraph', children: [{ text }] }];
  Transforms.select(editor, { path: [0, 0], offset });
  return { editor, plugin, onSearch };
};

const type = async (editor: Editor, text: string) => {
  for (const character of text) {
    editor.insertText(character);
    // Slate batches onChange into a microtask after each edit.
    await Promise.resolve();
  }
};

describe('EmojiPlugin suggestions', () => {
  it.each([
    { text: ' Demo1', offset: 0 },
    { text: 'Prefix  Demo1', offset: 7 },
    { text: ' Demo1: another colon', offset: 0 },
    { text: '', offset: 0 },
    { text: 'Demo1 ', offset: 6 },
  ])(
    'searches only the query before the caret in "$text"',
    async ({ text, offset }) => {
      const { editor, plugin, onSearch } = setup(text, offset);

      await type(editor, ':');
      expect(plugin.$store.get().isOpen).toBe(true);
      expect(onSearch).toHaveBeenLastCalledWith('');

      await type(editor, 'ta');
      expect(plugin.$store.get().isOpen).toBe(true);
      expect(onSearch.mock.calls.map(([query]) => query)).toEqual([
        '',
        't',
        'ta',
      ]);
      expect(Editor.string(editor, [0])).toBe(
        `${text.slice(0, offset)}:ta${text.slice(offset)}`,
      );
    },
  );

  it('does not open immediately before an existing word', async () => {
    const { editor, plugin, onSearch } = setup('text');

    await type(editor, ':');

    expect(plugin.$store.get().isOpen).toBe(false);
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('closes when the trigger is deleted', async () => {
    const { editor, plugin } = setup(' Demo1');
    await type(editor, ':');

    await editor.deleteBackward('character');
    await Promise.resolve();

    expect(plugin.$store.get().isOpen).toBe(false);
  });

  it('reads across formatted leaves within the current nested block', async () => {
    const { editor, onSearch } = setup('');
    editor.children = [
      {
        type: 'li',
        children: [
          {
            type: 'paragraph',
            children: [{ text: 'Prefix ' }, { text: ' Demo1', bold: true }],
          },
        ],
      },
    ];
    Transforms.select(editor, { path: [0, 0, 1], offset: 0 });

    await type(editor, ':ta');

    expect(onSearch).toHaveBeenLastCalledWith('ta');
  });

  it.each(['expanded', 'missing'])(
    'closes when the selection is %s',
    async (selection) => {
      const { editor, plugin } = setup(' Demo1');
      await type(editor, ':ta');

      if (selection === 'missing') {
        Transforms.deselect(editor);
      } else {
        Transforms.select(editor, {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 3 },
        });
      }
      await Promise.resolve();

      expect(plugin.$store.get().isOpen).toBe(false);
    },
  );

  it('renders suggestions while typing before an existing heading', async () => {
    const onSearch = vi.fn();
    const plugin = new EmojiPlugin({
      onSearch,
      renderMenu: () => <div role="menu" aria-label="Emoji suggestions" />,
      renderEmoji: () => null,
    });
    let editor: Editor | undefined;
    render(
      <KonaEditor
        initialValue={[
          {
            type: HeadingsPlugin.HeadingLevel1,
            children: [{ text: ' Demo1' }],
          },
        ]}
        plugins={[
          new BasicFormattingPlugin(),
          new HeadingsPlugin(),
          plugin,
          {
            init(value) {
              editor = value;
              return value;
            },
          },
        ]}
        onChange={() => {}}
      />,
    );
    if (!editor) throw new Error('Expected editor to be initialized');

    const range = document.createRange();
    range.selectNodeContents(screen.getByRole('heading', { level: 1 }));
    range.collapse(true);
    // jsdom has no range geometry; the real menu uses it for positioning.
    Object.defineProperty(range, 'getBoundingClientRect', {
      value: () => new DOMRect(),
    });
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    await act(async () => {
      Transforms.select(editor, Editor.start(editor, [0]));
      await type(editor, ':ta');
    });

    expect(
      screen.getByRole('menu', { name: 'Emoji suggestions' }),
    ).toBeInTheDocument();
    expect(onSearch).toHaveBeenLastCalledWith('ta');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      ':ta Demo1',
    );
  });
});
