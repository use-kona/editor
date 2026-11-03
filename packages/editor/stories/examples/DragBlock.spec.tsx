// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import {
  BasicFormattingPlugin,
  CodeBlockPlugin,
  DnDPlugin,
  KonaEditor,
} from '@use-kona/editor';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { afterEach, describe, expect, it } from 'vitest';
import { CodeBlock } from './CodeBlock';
import { DragBlock } from './DragBlock';
import styles from './DragBlock.module.css';

Object.assign(globalThis, { React });

afterEach(cleanup);

describe.each(['paragraph', 'code'])('%s drag handle selection', (type) => {
  const setup = () => {
    const plugins = [
      new BasicFormattingPlugin(),
      new CodeBlockPlugin({
        renderCodeBlock: (language, onChange, params) => (
          <CodeBlock value={language} onChange={onChange} params={params} />
        ),
      }),
      new DnDPlugin({
        onDropFiles() {},
        ignoreNodes: [CodeBlockPlugin.CODE_LINE_ELEMENT],
        renderBlock: (params) => <DragBlock {...params} />,
      }),
    ];
    const { container, getByText } = render(
      <DndProvider backend={HTML5Backend}>
        <KonaEditor
          plugins={plugins}
          initialValue={[
            type === 'code'
              ? {
                  type: 'code',
                  language: 'typescript',
                  children: [
                    {
                      type: 'code-line',
                      children: [{ text: 'const x = 123;' }],
                    },
                  ],
                }
              : { type: 'paragraph', children: [{ text: 'First' }] },
            { type: 'paragraph', children: [{ text: 'Second' }] },
          ]}
          onChange={() => {}}
        />
      </DndProvider>,
    );
    const blocks = container.querySelectorAll(
      '[data-slate-editor] > [data-editor-block]',
    );
    const handles = container.querySelectorAll(`.${styles.drag}`);
    const selected = () =>
      Array.from(container.querySelectorAll('[data-editor-selected]'));

    return { blocks, handles, selected, getByText };
  };

  it('replaces the selection when plain-clicking A then B', () => {
    const { blocks, handles, selected, getByText } = setup();

    expect(handles[0].getAttribute('draggable')).toBe('true');
    const icon = handles[0].querySelector('svg');
    if (!icon) throw new Error('Drag handle icon is missing');
    fireEvent.click(icon);
    expect(selected()).toEqual([blocks[0]]);

    fireEvent.click(handles[1]);
    expect(selected()).toEqual([blocks[1]]);

    fireEvent.click(getByText('Second'));
    expect(selected()).toEqual([]);
  });

  it('keeps only B when plain-clicking B in a multiple-block selection', () => {
    const { blocks, handles, selected } = setup();

    fireEvent.click(handles[0]);
    fireEvent.click(handles[1], { altKey: true });
    expect(selected()).toEqual([blocks[0], blocks[1]]);

    fireEvent.click(handles[1]);
    expect(selected()).toEqual([blocks[1]]);

    fireEvent.click(handles[1]);
    expect(selected()).toEqual([blocks[1]]);
  });

  it('adds an unselected block on Alt-click, preserving the selection', () => {
    const { blocks, handles, selected } = setup();

    fireEvent.click(handles[0]);
    expect(selected()).toEqual([blocks[0]]);

    fireEvent.click(handles[1], { altKey: true });
    expect(selected()).toEqual([blocks[0], blocks[1]]);
  });

  it('removes a selected block on Alt-click, preserving the others', () => {
    const { blocks, handles, selected } = setup();

    fireEvent.click(handles[0]);
    fireEvent.click(handles[1], { altKey: true });
    expect(selected()).toEqual([blocks[0], blocks[1]]);

    fireEvent.click(handles[0], { altKey: true });
    expect(selected()).toEqual([blocks[1]]);

    fireEvent.click(handles[1], { altKey: true });
    expect(selected()).toEqual([]);
  });
});
