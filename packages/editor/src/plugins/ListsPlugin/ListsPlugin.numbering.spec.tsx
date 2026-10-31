// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { Editor, Transforms } from 'slate';
import { Slate } from 'slate-react';
import { afterEach, expect, it } from 'vitest';
import { getShortcuts } from '../../../stories/examples/getShortcuts';
import { createEditable } from '../../core/createEditable';
import { createEditor } from '../../core/createEditor';
import { deserialize } from '../../core/deserialize';
import { serialize } from '../../core/serialize';
import { ShortcutsPlugin } from '../ShortcutsPlugin/ShortcutsPlugin';
import { ListsPlugin } from './ListsPlugin';

afterEach(cleanup);

const createListEditor = () => {
  const plugin = new ListsPlugin();
  const plugins = [plugin, new ShortcutsPlugin({ shortcuts: getShortcuts() })];
  const editor = createEditor(plugins)();
  editor.children = [{ type: 'paragraph', children: [{ text: '' }] }];
  Transforms.select(editor, Editor.start(editor, [0]));
  return { editor, plugin, plugins };
};

it.each([0, 1, 14, 123])('starts the numbered list shortcut at %i', (start) => {
  const { editor, plugins } = createListEditor();
  for (const character of `${start}. first`) editor.insertText(character);
  editor.insertBreak();
  editor.insertText('second');

  expect(editor.children).toEqual([
    {
      type: 'ol',
      start,
      children: [
        { type: 'li', children: [{ text: 'first' }] },
        { type: 'li', children: [{ text: 'second' }] },
      ],
    },
  ]);

  const Editable = createEditable(editor, plugins);
  const { container } = render(
    <Slate editor={editor} initialValue={editor.children}>
      <Editable />
    </Slate>,
  );
  expect(container.querySelector('ol')?.start).toBe(start);
});

it('preserves the starting number when exporting and importing HTML', () => {
  const { editor, plugin } = createListEditor();
  for (const character of '14. first') editor.insertText(character);
  const html = serialize([plugin])(editor.children[0]);
  expect(html).toBe('<ol start="14"><li>first</li></ol>');
  const document = new DOMParser().parseFromString(html, 'text/html');
  expect(deserialize([plugin])(document.body)).toEqual(editor.children);
});

it('keeps the default HTML numbering when no start is specified', () => {
  const { plugin } = createListEditor();
  const html = '<ol><li>first</li></ol>';
  const document = new DOMParser().parseFromString(html, 'text/html');
  const nodes = deserialize([plugin])(document.body);
  const list = {
    type: 'ol',
    children: [{ type: 'li', children: [{ text: 'first' }] }],
  };
  expect(nodes).toEqual([list]);
  expect(serialize([plugin])(list)).toBe(html);
});

it('preserves an explicit start next to an existing numbered list', () => {
  const { editor } = createListEditor();
  for (const character of '1. first') editor.insertText(character);
  editor.insertBreak();
  editor.insertBreak();
  for (const character of '14. second') editor.insertText(character);

  expect(editor.children).toHaveLength(2);
  expect(editor.children[1]).toMatchObject({ type: 'ol', start: 14 });
});

it('merges adjacent lists when the explicit start continues the numbering', () => {
  const { editor } = createListEditor();
  for (const character of '14. first') editor.insertText(character);
  editor.insertBreak();
  editor.insertBreak();
  for (const character of '15. second') editor.insertText(character);

  expect(editor.children).toHaveLength(1);
  expect(editor.children[0]).toMatchObject({ type: 'ol', start: 14 });
  expect(editor.children[0].children).toHaveLength(2);
});
