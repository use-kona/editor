// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import type { Editor } from 'slate';
import { describe, expect, it, vi } from 'vitest';
import { KonaEditor } from '../../editor';
import type { IPlugin } from '../../types';
import { CommandsPlugin } from './CommandsPlugin';

Object.assign(globalThis, { React });

const commands = [
  {
    name: 'one',
    commandName: 'one',
    title: 'One',
    icon: null,
    action: () => {},
  },
  {
    name: 'two',
    commandName: 'two',
    title: 'Two',
    icon: null,
    action: () => {},
  },
];

describe('CommandsPlugin keyboard navigation', () => {
  it('keeps the slash menu open when ArrowDown would select the void block below', async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    let editor: Editor;
    const onKeyDown = vi.fn();
    const plugin = new CommandsPlugin({
      commands,
      renderMenu: (children) => <div>{children}</div>,
    });
    const voidPlugin: IPlugin = {
      init(value) {
        editor = value;
        return value;
      },
      blocks: [
        {
          type: 'void',
          isVoid: true,
          render: (props) => <div {...props.attributes}>{props.children}</div>,
        },
      ],
      handlers: { onKeyDown },
    };

    render(
      <KonaEditor
        initialValue={[
          { type: 'paragraph', children: [{ text: '' }] },
          { type: 'void', children: [{ text: '' }] },
        ]}
        plugins={[plugin, voidPlugin]}
        onChange={() => {}}
      />,
    );

    act(() => editor.insertText('/'));
    await screen.findByRole('button', { name: 'One' });
    const before = screen
      .getAllByRole('button')
      .map((button) => button.className);

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowDown' });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Two' })).toBeInTheDocument(),
    );
    expect(
      screen.getAllByRole('button').map((button) => button.className),
    ).toEqual([before[1], before[0]]);
    expect(onKeyDown).not.toHaveBeenCalled();
  });
});
