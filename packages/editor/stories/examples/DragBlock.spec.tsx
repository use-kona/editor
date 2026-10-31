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
import { afterEach, expect, it } from 'vitest';
import { CodeBlock } from './CodeBlock';
import { DragBlock } from './DragBlock';
import styles from './DragBlock.module.css';

Object.assign(globalThis, { React });

afterEach(cleanup);

it.each(['paragraph', 'code'])(
  'selects a %s from the left handle without Meta and clears selection when clicking text',
  (type) => {
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

    expect(handles[0].getAttribute('draggable')).toBe('true');
    const icon = handles[0].querySelector('svg');
    if (!icon) throw new Error('Drag handle icon is missing');
    fireEvent.click(icon);
    expect(selected()).toEqual([blocks[0]]);

    fireEvent.click(handles[1], { metaKey: true });
    expect(selected()).toEqual([blocks[0], blocks[1]]);

    fireEvent.click(handles[0]);
    expect(selected()).toEqual([blocks[1]]);

    fireEvent.click(getByText('Second'));
    expect(selected()).toEqual([]);
  },
);
