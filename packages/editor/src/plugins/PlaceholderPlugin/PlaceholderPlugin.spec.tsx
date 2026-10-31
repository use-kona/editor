// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { type Descendant, Transforms } from 'slate';
import { Slate } from 'slate-react';
import { afterEach, expect, it } from 'vitest';
import { createEditable } from '../../core/createEditable';
import { createEditor } from '../../core/createEditor';
import { ListsPlugin } from '../ListsPlugin';
import { PlaceholderPlugin } from './PlaceholderPlugin';
import styles from './styles.module.css';

afterEach(cleanup);

const paragraph = (text = '') => ({ type: 'paragraph', children: [{ text }] });

const setup = (value: Descendant[]) => {
  const plugins = [
    new ListsPlugin(),
    new PlaceholderPlugin({ focused: 'Write /', unfocused: 'Empty' }),
  ];
  const editor = createEditor(plugins)();
  const Editable = createEditable(editor, plugins);
  const { container } = render(
    <Slate editor={editor} initialValue={value}>
      <Editable />
    </Slate>,
  );
  const placeholders = () =>
    Array.from(container.querySelectorAll(`.${styles.placeholder}`));
  const editable = container.querySelector('[data-slate-editor]');
  if (!editable) throw new Error('Expected an editable');
  const blocks = () => Array.from(editable.children);
  return { editor, placeholders, blocks };
};

it.each([false, true])(
  'shows only the top selected empty block (backward: %s)',
  async (backward) => {
    const { editor, placeholders, blocks } = setup([
      paragraph('Above'),
      paragraph(),
      paragraph(),
      paragraph(),
    ]);
    const start = { path: [1, 0], offset: 0 };
    const end = { path: [3, 0], offset: 0 };
    await act(async () =>
      Transforms.select(editor, {
        anchor: backward ? end : start,
        focus: backward ? start : end,
      }),
    );
    expect(placeholders()).toHaveLength(1);
    expect(blocks()[1].contains(placeholders()[0])).toBe(true);
  },
);

it('does not put placeholders on text when the selection ends in an empty block', async () => {
  const { editor, placeholders } = setup([paragraph('Text'), paragraph()]);
  await act(async () =>
    Transforms.select(editor, {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [1, 0], offset: 0 },
    }),
  );
  expect(placeholders()).toHaveLength(0);
});

it('moves the placeholder when the caret moves between empty blocks', async () => {
  const { editor, placeholders, blocks } = setup([paragraph(), paragraph()]);
  for (const index of [0, 1, 0]) {
    await act(async () =>
      Transforms.select(editor, { path: [index, 0], offset: 0 }),
    );
    expect(placeholders()).toHaveLength(1);
    expect(blocks()[index].contains(placeholders()[0])).toBe(true);
  }
});

it('shows a placeholder in an empty document without a selection', () => {
  const { placeholders } = setup([paragraph()]);
  expect(placeholders()).toHaveLength(1);
});

it('uses the first selected nested block', async () => {
  const { editor, placeholders } = setup([
    {
      type: ListsPlugin.BULLETED_LIST_ELEMENT,
      children: [
        { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: '' }] },
        { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: '' }] },
      ],
    },
  ]);
  await act(async () =>
    Transforms.select(editor, {
      anchor: { path: [0, 0, 0], offset: 0 },
      focus: { path: [0, 1, 0], offset: 0 },
    }),
  );
  expect(placeholders()).toHaveLength(1);
  expect(placeholders()[0].closest('[data-editor-block]')).toBe(
    document.querySelectorAll('[data-editor-block]')[1],
  );
});

it('updates the top block as a selection shrinks and expands', async () => {
  const { editor, placeholders, blocks } = setup([
    paragraph(),
    paragraph(),
    paragraph(),
  ]);
  for (const index of [0, 1, 0]) {
    await act(async () =>
      Transforms.select(editor, {
        anchor: { path: [index, 0], offset: 0 },
        focus: { path: [2, 0], offset: 0 },
      }),
    );
    expect(placeholders()).toHaveLength(1);
    expect(blocks()[index].contains(placeholders()[0])).toBe(true);
  }
});
