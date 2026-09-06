// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { Node, Transforms } from 'slate';
import { ReactEditor, Slate } from 'slate-react';
import { afterEach, expect, it } from 'vitest';
import type { IPlugin } from '../types';
import { createEditable } from './createEditable';
import { createEditor } from './createEditor';

afterEach(cleanup);

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
