/** @jsxRuntime classic */
/** @jsx jsx */

import type { KeyboardEvent, ReactNode } from 'react';
import { Editor } from 'slate';
import {
  createHyperscript,
  createText,
  type HyperscriptShorthands,
} from 'slate-hyperscript';
import { describe, expect, it, vi } from 'vitest';
import { createEditor } from '../../core/createEditor';
import { ListsPlugin } from './ListsPlugin';

const elements: HyperscriptShorthands = {
  paragraph: { type: 'paragraph' },
  numberedList: { type: ListsPlugin.NUMBERED_LIST_ELEMENT },
  bulletedList: { type: ListsPlugin.BULLETED_LIST_ELEMENT },
  listItem: { type: ListsPlugin.LIST_ITEM_ELEMENT },
  taskItem: { type: 'task-item' },
};

const jsx = createHyperscript({ elements, creators: { text: createText } });

jsx;

const createEditorAndPlugin = (
  children: ReactNode,
  options: ConstructorParameters<typeof ListsPlugin>[0] = {},
) => {
  const editorState = <editor>{children}</editor>;
  const plugin = new ListsPlugin(options);
  const editor = createEditor([plugin])();
  editor.children = editorState.children;
  editor.selection = editorState.selection;

  return { editor, plugin };
};

const createEditorWithPlugin = (children: ReactNode) => {
  return createEditorAndPlugin(children).editor;
};

describe('ListsPlugin', () => {
  it('should change current block to bulleted list', () => {
    const editor = createEditorWithPlugin(
      <paragraph>
        <cursor />
        <text>Hello world</text>
      </paragraph>,
    );

    ListsPlugin.toggleList(editor, ListsPlugin.BULLETED_LIST_ELEMENT);

    const output = (
      <editor>
        <bulletedList>
          <listItem>
            <text>Hello world</text>
          </listItem>
        </bulletedList>
      </editor>
    );

    expect(editor.children).toEqual(output.children);
  });

  it('should change current block to numbered list', () => {
    const editor = createEditorWithPlugin(
      <paragraph>
        <cursor />
        <text>Hello world</text>
      </paragraph>,
    );

    ListsPlugin.toggleList(editor, ListsPlugin.NUMBERED_LIST_ELEMENT);

    const output = (
      <editor>
        <numberedList>
          <listItem>
            <text>Hello world</text>
          </listItem>
        </numberedList>
      </editor>
    );

    expect(editor.children).toEqual(output.children);
  });

  it('should merge two adjacent bulleted lists during normalization', () => {
    const editor = createEditorWithPlugin(
      <paragraph>
        <text />
      </paragraph>,
    );

    editor.children = [
      {
        type: ListsPlugin.BULLETED_LIST_ELEMENT,
        children: [
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: 'one' }] },
        ],
      },
      {
        type: ListsPlugin.BULLETED_LIST_ELEMENT,
        children: [
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: 'two' }] },
        ],
      },
    ];
    editor.selection = null;

    Editor.normalize(editor, { force: true });

    const output = [
      {
        type: ListsPlugin.BULLETED_LIST_ELEMENT,
        children: [
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: 'one' }] },
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: 'two' }] },
        ],
      },
    ];

    expect(editor.children).toEqual(output);
  });

  it('should merge two adjacent numbered lists during normalization', () => {
    const editor = createEditorWithPlugin(
      <paragraph>
        <text />
      </paragraph>,
    );

    editor.children = [
      {
        type: ListsPlugin.NUMBERED_LIST_ELEMENT,
        children: [
          {
            type: ListsPlugin.LIST_ITEM_ELEMENT,
            children: [{ text: 'first' }],
          },
        ],
      },
      {
        type: ListsPlugin.NUMBERED_LIST_ELEMENT,
        children: [
          {
            type: ListsPlugin.LIST_ITEM_ELEMENT,
            children: [{ text: 'second' }],
          },
        ],
      },
    ];
    editor.selection = null;

    Editor.normalize(editor, { force: true });

    const output = [
      {
        type: ListsPlugin.NUMBERED_LIST_ELEMENT,
        children: [
          {
            type: ListsPlugin.LIST_ITEM_ELEMENT,
            children: [{ text: 'first' }],
          },
          {
            type: ListsPlugin.LIST_ITEM_ELEMENT,
            children: [{ text: 'second' }],
          },
        ],
      },
    ];

    expect(editor.children).toEqual(output);
  });

  it('should not merge lists of different types', () => {
    const editor = createEditorWithPlugin(
      <paragraph>
        <text />
      </paragraph>,
    );

    editor.children = [
      {
        type: ListsPlugin.BULLETED_LIST_ELEMENT,
        children: [
          {
            type: ListsPlugin.LIST_ITEM_ELEMENT,
            children: [{ text: 'bullet' }],
          },
        ],
      },
      {
        type: ListsPlugin.NUMBERED_LIST_ELEMENT,
        children: [
          {
            type: ListsPlugin.LIST_ITEM_ELEMENT,
            children: [{ text: 'number' }],
          },
        ],
      },
    ];
    editor.selection = null;

    Editor.normalize(editor, { force: true });

    const output = [
      {
        type: ListsPlugin.BULLETED_LIST_ELEMENT,
        children: [
          {
            type: ListsPlugin.LIST_ITEM_ELEMENT,
            children: [{ text: 'bullet' }],
          },
        ],
      },
      {
        type: ListsPlugin.NUMBERED_LIST_ELEMENT,
        children: [
          {
            type: ListsPlugin.LIST_ITEM_ELEMENT,
            children: [{ text: 'number' }],
          },
        ],
      },
    ];

    expect(editor.children).toEqual(output);
  });

  it('should merge multiple adjacent lists of same type', () => {
    const editor = createEditorWithPlugin(
      <paragraph>
        <text />
      </paragraph>,
    );

    editor.children = [
      {
        type: ListsPlugin.BULLETED_LIST_ELEMENT,
        children: [
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: '1' }] },
        ],
      },
      {
        type: ListsPlugin.BULLETED_LIST_ELEMENT,
        children: [
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: '2' }] },
        ],
      },
      {
        type: ListsPlugin.BULLETED_LIST_ELEMENT,
        children: [
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: '3' }] },
        ],
      },
    ];
    editor.selection = null;

    Editor.normalize(editor, { force: true });

    const output = [
      {
        type: ListsPlugin.BULLETED_LIST_ELEMENT,
        children: [
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: '1' }] },
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: '2' }] },
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: '3' }] },
        ],
      },
    ];

    expect(editor.children).toEqual(output);
  });

  it('should turn first-level list item into paragraph on Backspace at start', () => {
    const { editor, plugin } = createEditorAndPlugin(
      <bulletedList>
        <listItem>
          <cursor />
          <text>Hello world</text>
        </listItem>
      </bulletedList>,
    );
    const event = {
      key: 'Backspace',
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    plugin.handlers.onKeyDown(event, editor);

    const output = (
      <editor>
        <paragraph>
          <text>Hello world</text>
        </paragraph>
      </editor>
    );

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(editor.children).toEqual(output.children);
  });

  it('should ignore configured list item types for Backspace conversion', () => {
    const { editor, plugin } = createEditorAndPlugin(
      <bulletedList>
        <taskItem>
          <cursor />
          <text>Hello world</text>
        </taskItem>
      </bulletedList>,
      {
        ignoreBackspaceTypes: ['task-item'],
        listItemTypes: ['task-item'],
      },
    );
    const event = {
      key: 'Backspace',
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    plugin.handlers.onKeyDown(event, editor);

    const output = (
      <editor>
        <bulletedList>
          <taskItem>
            <text />
            <text>Hello world</text>
          </taskItem>
        </bulletedList>
      </editor>
    );

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(editor.children).toEqual(output.children);
  });
});
