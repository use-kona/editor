// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import {
  act,
  fireEvent,
  render,
  waitFor,
  within,
} from '@testing-library/react';
import { createDragDropManager, type DragDropManager } from 'dnd-core';
import React from 'react';
import { DndProvider } from 'react-dnd';
import type { Editor } from 'slate';
import { createEditor, Node, Editor as SlateEditor } from 'slate';
import { describe, expect, it, vi } from 'vitest';
import { KonaEditor } from '../../editor';
import type { IPlugin } from '../../types';
import { CollapsibleBlocksPlugin } from '../CollapsibleBlocksPlugin';
import { HeadingsPlugin } from '../HeadingsPlugin';
import { ListsPlugin } from '../ListsPlugin';
import { DnDPlugin, moveNode } from './DnDPlugin';

Object.assign(globalThis, { React });

const listEditor = () => {
  const editor = createEditor();
  editor.children = [
    {
      type: 'ol',
      nodeId: 'list',
      children: [
        { type: 'li', nodeId: 'first', children: [{ text: 'First' }] },
        { type: 'li', nodeId: 'second', children: [{ text: 'Second' }] },
      ],
    },
  ];
  return editor;
};

const sectionEditor = () => {
  const editor = createEditor();
  editor.children = [
    {
      type: 'heading1',
      nodeId: 'section',
      collapsed: true,
      children: [{ text: 'Section' }],
    },
    { type: 'paragraph', nodeId: 'text', children: [{ text: 'Section text' }] },
    {
      type: 'heading2',
      nodeId: 'nested',
      children: [{ text: 'Nested section' }],
    },
    {
      type: 'paragraph',
      nodeId: 'nested-text',
      children: [{ text: 'Nested text' }],
    },
    {
      type: 'heading1',
      nodeId: 'next',
      children: [{ text: 'Next section' }],
    },
  ];
  return editor;
};

describe('moveNode', () => {
  const paragraph = (text: string) => ({
    type: 'paragraph',
    nodeId: text,
    children: [{ text }],
  });

  const directions = [
    { direction: 'down', initial: ['A', 'X', 'B', 'Y'], source: 0, target: 2 },
    { direction: 'up', initial: ['X', 'B', 'Y', 'A'], source: 3, target: 1 },
  ];

  describe.each(['top', 'bottom'] as const)('drop at %s', (position) => {
    it.each(directions)(
      'moves one block $direction using IDs or a source path',
      ({ initial, source, target }) => {
        for (const useIds of [true, false]) {
          const editor = createEditor();
          editor.children = initial.map(paragraph);

          moveNode(editor, [target], useIds ? ['A'] : [], position, [source]);

          expect(editor.children.map(Node.string)).toEqual(
            position === 'top' ? ['X', 'A', 'B', 'Y'] : ['X', 'B', 'A', 'Y'],
          );
        }
      },
    );

    it.each([
      { name: 'down', initial: ['A', 'C', 'X', 'B', 'Y'] },
      { name: 'up', initial: ['X', 'B', 'Y', 'A', 'C'] },
      { name: 'noncontiguous', initial: ['A', 'X', 'C', 'B', 'Y'] },
      { name: 'across the target', initial: ['A', 'X', 'B', 'Y', 'C'] },
    ])('moves a selection $name in document order', ({ initial }) => {
      const editor = createEditor();
      editor.children = initial.map(paragraph);

      moveNode(editor, [initial.indexOf('B')], ['C', 'A'], position);

      expect(editor.children.map(Node.string)).toEqual(
        position === 'top'
          ? ['X', 'A', 'C', 'B', 'Y']
          : ['X', 'B', 'A', 'C', 'Y'],
      );
    });

    it.each([true, false])(
      'moves a section in both directions (collapsed=%s)',
      (collapsed) => {
        for (const direction of ['down', 'up']) {
          const editor = sectionEditor();
          const section = editor.children.slice(0, 4);
          Object.assign(section[0], { collapsed });
          const surrounding = ['X', 'B', 'Y'].map(paragraph);
          editor.children =
            direction === 'down'
              ? [...section, ...surrounding]
              : [...surrounding, ...section];
          const start = direction === 'down' ? 0 : 3;

          moveNode(
            editor,
            [direction === 'down' ? 5 : 1],
            [],
            position,
            undefined,
            [0, 1, 2, 3].map((index) => [start + index]),
          );

          expect(editor.children).toEqual(
            position === 'top'
              ? [surrounding[0], ...section, surrounding[1], surrounding[2]]
              : [surrounding[0], surrounding[1], ...section, surrounding[2]],
          );
        }
      },
    );

    it.each(directions)(
      'reorders items $direction within a nested list',
      ({ initial, source, target }) => {
        const editor = new ListsPlugin().init(createEditor());
        const items = initial.map((text) => ({
          ...paragraph(text),
          type: 'li',
        }));
        editor.children = [
          {
            type: 'ul',
            children: [
              { type: 'li', children: [{ text: 'Parent' }] },
              { type: 'ul', children: items },
              { type: 'li', children: [{ text: 'Tail' }] },
            ],
          },
        ];

        moveNode(editor, [0, 1, target], ['A'], position, [0, 1, source]);

        expect(
          Array.from(Node.children(editor, [0, 1]), ([node]) =>
            Node.string(node),
          ),
        ).toEqual(
          position === 'top' ? ['X', 'A', 'B', 'Y'] : ['X', 'B', 'A', 'Y'],
        );
        expect(Node.string(Node.get(editor, [0, 0]))).toBe('Parent');
        expect(Node.string(Node.get(editor, [0, 2]))).toBe('Tail');
      },
    );

    it.each(['into', 'out of'])(
      'moves an item %s a nested list',
      (direction) => {
        const editor = new ListsPlugin().init(createEditor());
        const item = (text: string) => ({ ...paragraph(text), type: 'li' });
        editor.children = [
          {
            type: 'ul',
            children: [
              item('A'),
              { type: 'ul', children: [item('B'), item('C')] },
              item('D'),
            ],
          },
        ];

        if (direction === 'into') {
          moveNode(editor, [0, 1, 0], ['A'], position);
          expect(editor.children).toEqual([
            {
              type: 'ul',
              children: [
                {
                  type: 'ul',
                  children: (position === 'top'
                    ? ['A', 'B', 'C']
                    : ['B', 'A', 'C']
                  ).map(item),
                },
                item('D'),
              ],
            },
          ]);
        } else {
          moveNode(editor, [0, 2], ['B'], position);
          const nested = { type: 'ul', children: [item('C')] };
          expect(editor.children).toEqual([
            {
              type: 'ul',
              children:
                position === 'top'
                  ? [item('A'), nested, item('B'), item('D')]
                  : [item('A'), nested, item('D'), item('B')],
            },
          ]);
        }
      },
    );
  });

  it.each(['top', 'bottom'] as const)(
    'does not move a selection onto itself at %s',
    (position) => {
      const editor = createEditor();
      editor.children = ['A', 'B', 'C'].map(paragraph);
      const original = structuredClone(editor.children);

      moveNode(editor, [1], ['A', 'B'], position);

      expect(editor.children).toEqual(original);
      expect(SlateEditor.pathRefs(editor).size).toBe(0);
    },
  );

  it('moves a list item before another list item', () => {
    const editor = listEditor();

    moveNode(editor, [0, 0], ['second'], 'top');

    expect(editor.children[0].children.map((node) => node.nodeId)).toEqual([
      'second',
      'first',
    ]);
  });

  it('allows dropping at the end of a list', () => {
    const editor = listEditor();

    moveNode(editor, [0, 1], ['first'], 'bottom');

    expect(editor.children[0].children.map((node) => node.nodeId)).toEqual([
      'second',
      'first',
    ]);
  });

  it('moves a collapsed section with all of its content', () => {
    const editor = sectionEditor();

    moveNode(editor, [4], [], 'bottom', undefined, [[0], [1], [2], [3]]);

    expect(editor.children.map((node) => node.children[0].text)).toEqual([
      'Next section',
      'Section',
      'Section text',
      'Nested section',
      'Nested text',
    ]);
    expect(editor.children[1]).toMatchObject({ collapsed: true });
  });

  it('moves a nested section without crossing the next equal-or-higher boundary', () => {
    const editor = sectionEditor();

    moveNode(editor, [4], [], 'bottom', undefined, [[2], [3]]);

    expect(editor.children.map((node) => node.children[0].text)).toEqual([
      'Section',
      'Section text',
      'Next section',
      'Nested section',
      'Nested text',
    ]);
  });

  it('does not move a section when dropped onto one of its own blocks', () => {
    const editor = sectionEditor();

    moveNode(editor, [2], [], 'top', undefined, [[0], [1], [2], [3]]);

    expect(editor.children.map((node) => node.children[0].text)).toEqual([
      'Section',
      'Section text',
      'Nested section',
      'Nested text',
      'Next section',
    ]);
  });
});

const createDndManager = (): DragDropManager =>
  createDragDropManager(() => ({
    connectDragPreview: () => () => {},
    connectDragSource: () => () => {},
    connectDropTarget: () => () => {},
    profile: () => ({}),
    setup: () => {},
    teardown: () => {},
  }));

const getHandlerIds = (
  manager: DragDropManager,
  kind: 'dragSources' | 'dropTargets',
) => {
  const registry = manager.getRegistry() as unknown as Record<
    'dragSources' | 'dropTargets',
    Map<string, unknown>
  >;
  return [...registry[kind].keys()];
};

describe('DnDPlugin', () => {
  it.each([
    {
      selected: [],
      direction: 'down',
      source: 0,
      target: 2,
      y: 0,
      expected: ['Second', 'First', 'Third', 'Fourth'],
    },
    {
      selected: [],
      direction: 'up',
      source: 3,
      target: 1,
      y: 0,
      expected: ['First', 'Fourth', 'Second', 'Third'],
    },
    {
      selected: [],
      direction: 'down',
      source: 0,
      target: 2,
      y: 100,
      expected: ['Second', 'Third', 'First', 'Fourth'],
    },
    {
      selected: [],
      direction: 'up',
      source: 3,
      target: 1,
      y: 100,
      expected: ['First', 'Second', 'Fourth', 'Third'],
    },
    {
      selected: [0, 1],
      direction: 'down',
      source: 0,
      target: 3,
      y: 0,
      expected: ['Third', 'First', 'Second', 'Fourth'],
    },
    {
      selected: [2, 3],
      direction: 'up',
      source: 3,
      target: 0,
      y: 100,
      expected: ['First', 'Third', 'Fourth', 'Second'],
    },
  ])(
    'reorders rendered paragraphs $direction at y=$y',
    async ({ selected, source, target, y, expected }) => {
      const manager = createDndManager();
      const onChange = vi.fn();
      let editor: Editor | undefined;

      const dndPlugin = new DnDPlugin({
        onDropFiles: () => {},
        renderBlock: ({
          dragRef,
          dropRef,
          previewRef,
          props,
          onToggleSelected,
        }) =>
          React.createElement(
            'div',
            {
              ...props.attributes,
              ref: (element) => dropRef(previewRef(element)),
            },
            React.createElement(
              'button',
              { contentEditable: false, ref: dragRef, type: 'button' },
              'Drag',
            ),
            React.createElement(
              'button',
              {
                type: 'button',
                contentEditable: false,
                onClick: onToggleSelected,
              },
              'Select',
            ),
            props.children,
          ),
      });

      const view = render(
        React.createElement(
          DndProvider,
          { manager },
          React.createElement(KonaEditor, {
            initialValue: [
              {
                type: 'paragraph',
                nodeId: 'First',
                children: [{ text: 'First' }],
              },
              {
                type: 'paragraph',
                nodeId: 'Second',
                children: [{ text: 'Second' }],
              },
              {
                type: 'paragraph',
                nodeId: 'Third',
                children: [{ text: 'Third' }],
              },
              {
                type: 'paragraph',
                nodeId: 'Fourth',
                children: [{ text: 'Fourth' }],
              },
            ],
            plugins: [
              dndPlugin,
              {
                init(value) {
                  editor = value;
                  return value;
                },
              } satisfies IPlugin,
            ],
            onChange,
          }),
        ),
      );

      for (const index of selected) {
        fireEvent.click(within(view.container).getAllByText('Select')[index]);
      }

      const originalRect = HTMLElement.prototype.getBoundingClientRect;
      Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({ bottom: 100, top: 0 }),
      });

      try {
        const sourceIds = getHandlerIds(manager, 'dragSources');
        const targetIds = getHandlerIds(manager, 'dropTargets');

        expect(sourceIds).toHaveLength(4);
        expect(targetIds).toHaveLength(4);

        await act(async () => {
          manager.getActions().beginDrag([sourceIds[source]], {
            clientOffset: { x: 0, y: 50 },
            getSourceClientOffset: () => ({ x: 0, y: 0 }),
          });
          manager.getActions().publishDragSource();
          manager
            .getActions()
            .hover([targetIds[target]], { clientOffset: { x: 0, y } });
          expect(manager.getMonitor().canDropOnTarget(targetIds[target])).toBe(
            true,
          );
          manager.getActions().drop();
          manager.getActions().endDrag();
        });
      } finally {
        Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
          configurable: true,
          value: originalRect,
        });
      }

      expect(editor?.children.map(Node.string)).toEqual(expected);
      await waitFor(() =>
        expect(onChange).toHaveBeenLastCalledWith(editor?.children),
      );
    },
  );

  it('moves every block in an expanded collapsible section', async () => {
    const manager = createDndManager();
    const onChange = vi.fn();
    let editor: Editor | undefined;

    const dndPlugin = new DnDPlugin({
      onDropFiles: () => {},
      renderBlock: ({ dragRef, dropRef, previewRef, props }) =>
        React.createElement(
          'div',
          {
            ...props.attributes,
            ref: (element) => dropRef(previewRef(element)),
          },
          React.createElement(
            'button',
            { contentEditable: false, ref: dragRef, type: 'button' },
            'Drag',
          ),
          props.children,
        ),
    });

    render(
      React.createElement(
        DndProvider,
        { manager },
        React.createElement(KonaEditor, {
          initialValue: [
            {
              type: HeadingsPlugin.HeadingLevel1,
              children: [{ text: 'Section' }],
            },
            { type: 'paragraph', children: [{ text: 'Section text' }] },
            {
              type: HeadingsPlugin.HeadingLevel2,
              children: [{ text: 'Nested section' }],
            },
            { type: 'paragraph', children: [{ text: 'Nested text' }] },
            {
              type: HeadingsPlugin.HeadingLevel1,
              children: [{ text: 'Next section' }],
            },
          ],
          plugins: [
            new HeadingsPlugin(),
            new CollapsibleBlocksPlugin([
              HeadingsPlugin.HeadingLevel1,
              HeadingsPlugin.HeadingLevel2,
            ]),
            dndPlugin,
            {
              init(value) {
                editor = value;
                return value;
              },
            } satisfies IPlugin,
          ],
          onChange,
        }),
      ),
    );

    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ bottom: 100, top: 0 }),
    });

    try {
      const sourceIds = getHandlerIds(manager, 'dragSources');
      const targetIds = getHandlerIds(manager, 'dropTargets');

      act(() => {
        manager.getActions().beginDrag([sourceIds[0]], {
          clientOffset: { x: 0, y: 50 },
          getSourceClientOffset: () => ({ x: 0, y: 0 }),
        });
        manager.getActions().publishDragSource();
        manager
          .getActions()
          .hover([targetIds[4]], { clientOffset: { x: 0, y: 100 } });
        manager.getActions().drop();
        manager.getActions().endDrag();
      });
    } finally {
      Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
        configurable: true,
        value: originalRect,
      });
    }

    expect(editor?.children.map((node) => node.children[0].text)).toEqual([
      'Next section',
      'Section',
      'Section text',
      'Nested section',
      'Nested text',
    ]);
    await waitFor(() => expect(onChange).toHaveBeenCalled());
  });

  it('hides custom drag wrappers for collapsed section content', async () => {
    const manager = createDndManager();
    const dndPlugin = new DnDPlugin({
      onDropFiles: () => {},
      renderBlock: ({ dragRef, dropRef, previewRef, props }) =>
        React.createElement(
          'div',
          {
            ...props.attributes,
            'data-dnd-block': (props.element as { nodeId: string }).nodeId,
            ref: (element) => dropRef(previewRef(element)),
          },
          React.createElement(
            'button',
            { contentEditable: false, ref: dragRef, type: 'button' },
            'Drag',
          ),
          props.children,
        ),
    });

    render(
      React.createElement(
        DndProvider,
        { manager },
        React.createElement(KonaEditor, {
          initialValue: [
            {
              type: HeadingsPlugin.HeadingLevel1,
              nodeId: 'section',
              collapsed: true,
              children: [{ text: 'Section' }],
            },
            {
              type: 'paragraph',
              nodeId: 'section-text',
              children: [{ text: 'Section text' }],
            },
            {
              type: HeadingsPlugin.HeadingLevel1,
              nodeId: 'next-section',
              children: [{ text: 'Next section' }],
            },
          ],
          plugins: [
            new HeadingsPlugin(),
            new CollapsibleBlocksPlugin([HeadingsPlugin.HeadingLevel1]),
            dndPlugin,
          ],
          onChange: () => {},
        }),
      ),
    );

    const hiddenDragBlock = document.querySelector(
      '[data-dnd-block="section-text"]',
    );

    expect(hiddenDragBlock).not.toBeVisible();
  });
});
