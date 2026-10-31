// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Editor, Transforms } from 'slate';
import { ReactEditor, Slate } from 'slate-react';
import { afterEach, describe, expect, it } from 'vitest';
import { createEditable } from '../../core/createEditable';
import { createEditor } from '../../core/createEditor';
import { BasicFormattingPlugin } from '../BasicFormattingPlugin';
import { BreaksPlugin } from '../BreaksPlugin';
import { ListsPlugin } from '../ListsPlugin';
import { HighlightsPlugin } from './HighlightsPlugin';

afterEach(cleanup);

const highlighted = { text: 'Highlighted', highlight: 'yellow', bold: true };

const setup = (highlightLast = false) => {
  const plugin = new HighlightsPlugin({ colors: { yellow: '#ff0' } });
  const breaks = new BreaksPlugin({ breakNodes: ['heading1'] });
  const plugins = highlightLast ? [breaks, plugin] : [plugin, breaks];
  const editor = createEditor(plugins)();
  editor.children = [{ type: 'paragraph', children: [{ ...highlighted }] }];
  Transforms.select(editor, Editor.end(editor, [0]));
  return { editor, plugin };
};

const pressRight = (plugin: HighlightsPlugin, editor: Editor, init = {}) => {
  const event = new KeyboardEvent('keydown', {
    key: 'ArrowRight',
    cancelable: true,
    ...init,
  });
  Object.assign(event, { nativeEvent: event });
  plugin.handlers.onKeyDown(event as unknown as ReactKeyboardEvent, editor);
  return event;
};

describe('Enter at a highlight boundary', () => {
  it.each([false, true])(
    'starts an unhighlighted paragraph regardless of plugin order (%s)',
    (highlightLast) => {
      const { editor } = setup(highlightLast);
      editor.insertBreak();
      editor.insertText('Plain');

      expect(editor.children).toEqual([
        { type: 'paragraph', children: [highlighted] },
        { type: 'paragraph', children: [{ text: 'Plain', bold: true }] },
      ]);
    },
  );

  it('preserves the highlight when splitting in the middle', () => {
    const { editor } = setup();
    Transforms.select(editor, { path: [0, 0], offset: 4 });
    editor.insertBreak();
    editor.insertText('Still highlighted');

    expect(editor.children[1].children).toEqual([
      { ...highlighted, text: 'Still highlightedlighted' },
    ]);
  });

  it('keeps the new empty paragraph unhighlighted after moving away and back', () => {
    const { editor } = setup();
    editor.insertBreak();
    Transforms.select(editor, Editor.start(editor, [0]));
    Transforms.select(editor, Editor.start(editor, [1]));
    editor.insertText('Plain');

    expect(editor.children[1].children).toEqual([
      { text: 'Plain', bold: true },
    ]);
  });

  it('keeps a continuous highlight across changes in other formatting', () => {
    const { editor } = setup();
    editor.children[0].children.push({
      text: ' continuation',
      highlight: 'yellow',
    });
    editor.insertBreak();
    editor.insertText('Still highlighted');

    expect(Editor.marks(editor)).toMatchObject({ highlight: 'yellow' });
  });

  it('does not clear highlight when Enter replaces a selection', () => {
    const { editor } = setup();
    Transforms.select(editor, {
      anchor: { path: [0, 0], offset: 4 },
      focus: Editor.end(editor, [0]),
    });
    editor.insertBreak();
    editor.insertText('Still highlighted');

    expect(editor.children[1].children[0]).toMatchObject({
      highlight: 'yellow',
    });
  });

  it('preserves existing highlighted text after the new paragraph starts', () => {
    const { editor } = setup();
    editor.children[0].children.push({ text: 'Blue', highlight: 'blue' });
    editor.insertBreak();
    editor.insertText('Plain');

    expect(editor.children[1].children).toEqual([
      { text: 'Plain', bold: true },
      { text: 'Blue', highlight: 'blue' },
    ]);
  });

  it('continues to convert a heading to a paragraph', () => {
    const { editor } = setup();
    editor.children[0].type = 'heading1';
    editor.insertBreak();
    editor.insertText('Plain');

    expect(editor.children[1]).toEqual({
      type: 'paragraph',
      children: [{ text: 'Plain', bold: true }],
    });
  });

  it('starts an unhighlighted list item', () => {
    const plugin = new HighlightsPlugin({ colors: { yellow: '#ff0' } });
    const editor = createEditor([plugin, new ListsPlugin({})])();
    editor.children = [
      {
        type: ListsPlugin.BULLETED_LIST_ELEMENT,
        children: [
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [highlighted] },
        ],
      },
    ];
    Transforms.select(editor, Editor.end(editor, [0]));
    editor.insertBreak();
    editor.insertText('Plain');

    expect(editor.children[0].children[1]).toEqual({
      type: ListsPlugin.LIST_ITEM_ELEMENT,
      children: [{ text: 'Plain', bold: true }],
    });
  });
});

describe('Right Arrow at a highlight boundary', () => {
  it('exits without moving or modifying the highlighted text', () => {
    const { editor, plugin } = setup();
    const selection = editor.selection;
    expect(pressRight(plugin, editor).defaultPrevented).toBe(true);
    expect(editor.selection).toEqual(selection);
    expect(editor.children[0].children).toEqual([highlighted]);
    expect(Editor.marks(editor)).toEqual({ bold: true });

    editor.insertText(' plain');
    expect(editor.children[0].children).toEqual([
      highlighted,
      { text: ' plain', bold: true },
    ]);
  });

  it('allows the next Right Arrow to navigate normally', () => {
    const { editor, plugin } = setup();
    pressRight(plugin, editor);
    expect(pressRight(plugin, editor).defaultPrevented).toBe(false);
  });

  it('starts plain text after exiting and then pressing Enter', () => {
    const { editor, plugin } = setup();
    pressRight(plugin, editor);
    editor.insertBreak();
    editor.insertText('Plain');
    expect(editor.children[1].children).toEqual([
      { text: 'Plain', bold: true },
    ]);
  });

  it.each([0, 1])(
    'exits on either representation of the text boundary (%s)',
    (index) => {
      const { editor, plugin } = setup();
      editor.children[0].children.push({ text: ' after' });
      Transforms.select(editor, {
        path: [0, index],
        offset: index === 0 ? highlighted.text.length : 0,
      });
      expect(pressRight(plugin, editor).defaultPrevented).toBe(true);
      editor.insertText(' plain');
      expect(editor.children[0].children).toEqual([
        highlighted,
        { text: ' plain', bold: true },
        { text: ' after' },
      ]);
    },
  );

  it('does not treat a formatting change inside one highlight as its end', () => {
    const { editor, plugin } = setup();
    editor.children[0].children.push({
      text: ' continuation',
      highlight: 'yellow',
    });
    expect(pressRight(plugin, editor).defaultPrevented).toBe(false);
    Transforms.select(editor, { path: [0, 0], offset: 4 });
    expect(pressRight(plugin, editor).defaultPrevented).toBe(false);
  });

  it.each([
    { shiftKey: true },
    { altKey: true },
    { ctrlKey: true },
    { metaKey: true },
    { isComposing: true },
  ])('leaves modified navigation and composition alone (%j)', (init) => {
    const { editor, plugin } = setup();
    expect(pressRight(plugin, editor, init).defaultPrevented).toBe(false);
    expect(Editor.marks(editor)).toHaveProperty('highlight', 'yellow');
  });

  it('does not collapse a selection or intercept an already handled event', () => {
    const { editor, plugin } = setup();
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      cancelable: true,
    });
    event.preventDefault();
    plugin.handlers.onKeyDown(event as unknown as ReactKeyboardEvent, editor);
    expect(Editor.marks(editor)).toHaveProperty('highlight', 'yellow');

    Transforms.select(editor, Editor.range(editor, [0]));
    expect(pressRight(plugin, editor).defaultPrevented).toBe(false);
  });

  it('handles rendered Right Arrow events and then resumes normal navigation', async () => {
    const { editor, plugin } = setup();
    editor.children[0].children.push({ text: ' after' });
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
      ReactEditor.focus(editor);
    });
    const selection = editor.selection;
    await act(async () => {
      fireEvent.keyDown(editable, {
        key: 'ArrowRight',
        keyCode: 39,
        which: 39,
      });
    });
    expect(editor.selection).toEqual(selection);
    expect(Editor.marks(editor)).not.toHaveProperty('highlight');
    await act(async () => {
      fireEvent.keyDown(editable, {
        key: 'ArrowRight',
        keyCode: 39,
        which: 39,
      });
    });
    expect(editor.selection?.focus).toEqual({ path: [0, 1], offset: 1 });
  });
});
