// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { Transforms } from 'slate';
import { ReactEditor, Slate } from 'slate-react';
import { afterEach, describe, expect, it } from 'vitest';
import { createEditable } from '../../core/createEditable';
import { createEditor } from '../../core/createEditor';
import { BasicFormattingPlugin } from '../BasicFormattingPlugin';
import { EmojiPlugin } from './EmojiPlugin';

afterEach(cleanup);

const setup = () => {
  const plugin = new EmojiPlugin({
    onSearch: () => {},
    renderMenu: () => null,
    renderEmoji: () => <span>🎉</span>,
  });
  const editor = createEditor([new BasicFormattingPlugin(), plugin])();
  editor.children = [
    {
      type: 'paragraph',
      children: [
        { text: 'Before' },
        { type: 'emoji', emoji: 'tada', children: [{ text: '' }] },
        { text: 'After' },
      ],
    },
  ];
  return { editor, plugin };
};

const before = { path: [0, 0], offset: 6 };
const after = { path: [0, 2], offset: 0 };

describe('EmojiPlugin caret navigation', () => {
  it.each([
    { reverse: false, from: before, to: after },
    { reverse: true, from: after, to: before },
  ])(
    'skips the emoji in one character move (reverse: $reverse)',
    async ({ reverse, from, to }) => {
      const { editor } = setup();
      Transforms.select(editor, from);

      Transforms.move(editor, { unit: 'character', reverse });

      expect(editor.selection).toEqual({ anchor: to, focus: to });
    },
  );

  it.each([
    { key: 'ArrowRight', from: before, to: after },
    { key: 'ArrowLeft', from: after, to: before },
  ])(
    'moves directly across a rendered emoji with $key',
    async ({ key, from, to }) => {
      const { editor, plugin } = setup();
      const Editable = createEditable(editor, [
        new BasicFormattingPlugin(),
        plugin,
      ]);
      const { container } = render(
        <Slate editor={editor} initialValue={editor.children}>
          <Editable />
        </Slate>,
      );
      const editable = container.querySelector<HTMLElement>(
        '[data-slate-editor]',
      );
      if (!editable) throw new Error('Expected an editable');
      Object.defineProperty(editable, 'isContentEditable', { value: true });
      await act(async () => {
        Transforms.select(editor, from);
        ReactEditor.focus(editor);
      });

      await act(async () => {
        const keyCode = key === 'ArrowRight' ? 39 : 37;
        fireEvent.keyDown(editable, { key, keyCode, which: keyCode });
      });

      expect(editor.selection).toEqual({ anchor: to, focus: to });
      expect(ReactEditor.toDOMPoint(editor, to)).toBeDefined();
      expect(
        container.querySelector('[data-slate-void] [data-slate-node="text"]'),
      ).not.toBeNull();
    },
  );

  it.each([
    { reverse: false, from: before, to: after },
    { reverse: true, from: after, to: before },
  ])(
    'can extend a selection across the emoji (reverse: $reverse)',
    ({ reverse, from, to }) => {
      const { editor } = setup();
      Transforms.select(editor, from);

      Transforms.move(editor, { unit: 'character', edge: 'focus', reverse });

      expect(editor.selection).toEqual({ anchor: from, focus: to });
    },
  );

  it.each([
    { direction: 'backward', from: after },
    { direction: 'forward', from: before },
  ])('deletes only the emoji $direction', async ({ direction, from }) => {
    const { editor } = setup();
    Transforms.select(editor, from);

    if (direction === 'backward') {
      await editor.deleteBackward('character');
    } else {
      await editor.deleteForward('character');
    }

    expect(editor.children).toEqual([
      { type: 'paragraph', children: [{ text: 'BeforeAfter' }] },
    ]);
  });

  it('keeps normal text movement after jumping across the emoji', () => {
    const { editor } = setup();
    Transforms.select(editor, before);

    Transforms.move(editor, { unit: 'character' });
    Transforms.move(editor, { unit: 'character' });

    expect(editor.selection?.focus).toEqual({ path: [0, 2], offset: 1 });
  });

  it('skips adjacent emojis without stopping in either hidden child', () => {
    const { editor } = setup();
    Transforms.insertNodes(
      editor,
      { type: 'emoji', emoji: 'rocket', children: [{ text: '' }] },
      { at: [0, 2] },
    );
    Transforms.select(editor, before);

    Transforms.move(editor, { unit: 'character' });
    expect(editor.selection?.focus).toEqual({ path: [0, 2], offset: 0 });
    Transforms.move(editor, { unit: 'character' });
    expect(editor.selection?.focus).toEqual({ path: [0, 4], offset: 0 });
  });
});
