// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import type { WritableAtom } from 'nanostores';
import { Node, Transforms } from 'slate';
import { ReactEditor, Slate } from 'slate-react';
import { afterEach, expect, it, vi } from 'vitest';
import type { CustomElement } from '../../types';
import { useEditorContext } from '../provider';
import type { IPlugin } from '../types';
import { createEditable } from './createEditable';
import { createEditor } from './createEditor';

afterEach(cleanup);

const paragraph = (text: string): CustomElement => ({
  type: 'paragraph',
  children: [{ text }],
});

const setupBlockSelection = (
  value: CustomElement[],
  plugins: IPlugin[] = [],
  readOnly = false,
) => {
  let selection!: WritableAtom<CustomElement[]>;
  const CaptureSelection = () => {
    selection = useEditorContext().selectedNodes;
    return null;
  };
  const allPlugins = [...plugins, { ui: () => <CaptureSelection /> }];
  const editor = createEditor(allPlugins)();
  const Editable = createEditable(editor, allPlugins);
  const { container } = render(
    <Slate editor={editor} initialValue={value}>
      <Editable readOnly={readOnly} />
    </Slate>,
  );
  const editable = container.querySelector<HTMLElement>('[data-slate-editor]');
  if (!editable) throw new Error('Editor is missing');
  Object.defineProperty(editable, 'isContentEditable', { value: !readOnly });
  const select = (nodes: CustomElement[]) => act(() => selection.set(nodes));
  const press = async (key: 'Backspace' | 'Delete') => {
    await act(async () => {
      fireEvent.keyDown(editable, {
        key,
        keyCode: key === 'Backspace' ? 8 : 46,
      });
    });
  };
  return { editor, selection: () => selection.get(), select, press };
};

it.each(['Backspace', 'Delete'] as const)(
  '%s removes all selected blocks, keeps gaps, and supports undo',
  async (key) => {
    const value = ['First', 'Keep', 'Third', 'Last'].map(paragraph);
    const pluginKeyDown = vi.fn();
    const view = setupBlockSelection(value, [
      { handlers: { onKeyDown: pluginKeyDown } },
    ]);
    // Block selection can be disjoint and ordered differently from the document.
    view.select([value[2], value[0]]);
    await act(async () => {
      Transforms.select(view.editor, { path: [0, 0], offset: 2 });
    });
    await view.press(key);

    expect(view.editor.children.map(Node.string)).toEqual(['Keep', 'Last']);
    expect(view.selection()).toEqual([]);
    expect(pluginKeyDown).not.toHaveBeenCalled();

    await act(async () => view.editor.undo());
    expect(view.editor.children).toEqual(value);
    await act(async () => view.editor.redo());
    expect(view.editor.children.map(Node.string)).toEqual(['Keep', 'Last']);
  },
);

it('deletes a selected parent and child only once, and leaves an editable paragraph when all blocks are removed', async () => {
  const child = { type: 'item', children: [{ text: 'Nested' }] };
  const value = [{ type: 'list', children: [child] }, paragraph('Last')];
  const view = setupBlockSelection(value, [
    {
      blocks: ['list', 'item'].map((type) => ({
        type,
        render: (props) => <div {...props.attributes}>{props.children}</div>,
      })),
    },
  ]);
  view.select([child, value[0], value[1]]);
  await view.press('Delete');

  expect(view.editor.children).toEqual([paragraph('')]);
  expect(view.editor.selection).toEqual({
    anchor: { path: [0, 0], offset: 0 },
    focus: { path: [0, 0], offset: 0 },
  });
  expect(view.selection()).toEqual([]);
});

it('checks deletion hooks before removing the group and preserves selection when vetoed', async () => {
  const value = [
    paragraph('First'),
    { type: 'widget', children: [{ text: '' }] },
    paragraph('Last'),
  ];
  const onBeforeDelete = vi.fn().mockResolvedValue(false);
  const onDelete = vi.fn();
  const view = setupBlockSelection(value, [
    {
      blocks: [
        {
          type: 'widget',
          isVoid: true,
          render: (props) => <div {...props.attributes}>{props.children}</div>,
          onBeforeDelete,
          onDelete,
        },
      ],
    },
  ]);
  view.select(value.slice(0, 2));
  await view.press('Backspace');

  expect(view.editor.children).toEqual(value);
  expect(view.selection()).toEqual(value.slice(0, 2));
  expect(onBeforeDelete).toHaveBeenCalledWith([value[1]]);
  expect(onDelete).not.toHaveBeenCalled();

  onBeforeDelete.mockResolvedValue(true);
  await view.press('Delete');
  expect(view.editor.children).toEqual([value[2]]);
  expect(onDelete).toHaveBeenCalledWith([value[1]]);
});

it('does not delete a block selection in a read-only editor', async () => {
  const value = [paragraph('First'), paragraph('Second')];
  const view = setupBlockSelection(value, [], true);
  view.select(value);
  await view.press('Delete');
  expect(view.editor.children).toEqual(value);
});

it('tracks block paths during asynchronous hooks and ignores repeated delete presses', async () => {
  let approve!: (allowed: boolean) => void;
  const onBeforeDelete = vi.fn(
    () =>
      new Promise<boolean>((resolve) => {
        approve = resolve;
      }),
  );
  const onDelete = vi.fn();
  const value = [paragraph('First'), paragraph('Second'), paragraph('Last')];
  const view = setupBlockSelection(value, [
    {
      blocks: [
        {
          type: 'paragraph',
          render: (props) => <p {...props.attributes}>{props.children}</p>,
          onBeforeDelete,
          onDelete,
        },
      ],
    },
  ]);
  view.select([value[0]]);
  await view.press('Delete');
  await view.press('Delete');
  expect(onBeforeDelete).toHaveBeenCalledTimes(1);
  expect(view.editor.children).toEqual(value);

  await act(async () => {
    Transforms.insertNodes(view.editor, paragraph('Inserted'), { at: [0] });
    approve(true);
  });
  expect(view.editor.children.map(Node.string)).toEqual([
    'Inserted',
    'Second',
    'Last',
  ]);
  expect(onDelete).toHaveBeenCalledWith([value[0]]);
  expect(view.selection()).toEqual([]);
  expect(view.editor.pathRefs().size).toBe(0);
});

it.each([
  {
    name: 'after an inline void deletes only the chip',
    point: { path: [1, 2], offset: 0 },
    text: ['Previous link.', 'Keep this text '],
  },
  {
    name: 'at a paragraph start merges text rather than selecting a preceding inline void',
    point: { path: [1, 0], offset: 0 },
    text: ['Previous link.Keep this text delete me'],
  },
])('Backspace $name', async ({ point, text }) => {
  const plugin: IPlugin = {
    blocks: [
      {
        type: 'chip',
        isInline: true,
        isVoid: true,
        render: (props) => (
          <span {...props.attributes}>
            {props.children}
            <span contentEditable={false}>Chip</span>
          </span>
        ),
      },
    ],
    leafs: [
      {
        render: (props) => <span {...props.attributes}>{props.children}</span>,
      },
    ],
  };
  const editor = createEditor([plugin])();
  const Editable = createEditable(editor, [plugin]);
  const value = [
    {
      type: 'paragraph',
      children: [
        { text: 'Previous ' },
        { type: 'chip', children: [{ text: 'link' }] },
        { text: '.' },
      ],
    },
    {
      type: 'paragraph',
      children: [
        { text: 'Keep this text ' },
        { type: 'chip', children: [{ text: 'delete me' }] },
        { text: '' },
      ],
    },
  ];
  const { container } = render(
    <Slate editor={editor} initialValue={value}>
      <Editable />
    </Slate>,
  );
  const editable = container.querySelector<HTMLElement>('[data-slate-editor]')!;
  // jsdom does not implement this browser property, which Slate checks for keyboard events.
  Object.defineProperty(editable, 'isContentEditable', { value: true });
  await act(async () => {
    Transforms.select(editor, point);
    ReactEditor.focus(editor);
  });

  await act(async () => {
    const useDefault = fireEvent.keyDown(editable, {
      key: 'Backspace',
      keyCode: 8,
    });
    // jsdom does not dispatch the browser's beforeinput deletion.
    if (useDefault) await editor.deleteBackward('character');
  });

  expect(editor.children.map(Node.string)).toEqual(text);
});
