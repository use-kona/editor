/** @jsxRuntime classic */
/** @jsx jsx */

import {
  createHyperscript,
  createText,
  HyperscriptShorthands,
} from 'slate-hyperscript';
import { describe, expect, it } from 'vitest';
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
        <paragraph>
          <text></text>
        </paragraph>
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
        <paragraph>
          <text></text>
        </paragraph>
      </editor>
    );

    expect(editor.children).toEqual(output.children);
  });
});
