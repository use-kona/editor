/** @jsxRuntime classic */
/** @jsx jsx */

import {
  createHyperscript,
  createText,
  type HyperscriptShorthands,
} from 'slate-hyperscript';
import { describe, expect, it } from 'vitest';
import { Editor } from 'slate';
import { createEditor } from '../../core/createEditor';
import { ListsPlugin } from './ListsPlugin';


const elements: HyperscriptShorthands = {
  paragraph: { type: 'paragraph' },
  numberedList: { type: ListsPlugin.NUMBERED_LIST_ELEMENT },
  bulletedList: { type: ListsPlugin.BULLETED_LIST_ELEMENT },
  listItem: { type: ListsPlugin.LIST_ITEM_ELEMENT },
};

const jsx = createHyperscript({ elements, creators: { text: createText } });

jsx;

const createEditorWithPlugin = (children: any) => {
  const editorState = <editor>{children}</editor>;
  const editor = createEditor([new ListsPlugin()])();
  editor.children = editorState.children;
  editor.selection = editorState.selection;

  return editor;
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
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: 'first' }] },
        ],
      },
      {
        type: ListsPlugin.NUMBERED_LIST_ELEMENT,
        children: [
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: 'second' }] },
        ],
      },
    ];
    editor.selection = null;

    Editor.normalize(editor, { force: true });

    const output = [
      {
        type: ListsPlugin.NUMBERED_LIST_ELEMENT,
        children: [
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: 'first' }] },
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: 'second' }] },
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
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: 'bullet' }] },
        ],
      },
      {
        type: ListsPlugin.NUMBERED_LIST_ELEMENT,
        children: [
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: 'number' }] },
        ],
      },
    ];
    editor.selection = null;

    Editor.normalize(editor, { force: true });

    const output = [
      {
        type: ListsPlugin.BULLETED_LIST_ELEMENT,
        children: [
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: 'bullet' }] },
        ],
      },
      {
        type: ListsPlugin.NUMBERED_LIST_ELEMENT,
        children: [
          { type: ListsPlugin.LIST_ITEM_ELEMENT, children: [{ text: 'number' }] },
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
});
