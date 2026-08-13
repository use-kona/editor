// @vitest-environment jsdom

import { act, render, waitFor } from '@testing-library/react';
import { createDragDropManager, type DragDropManager } from 'dnd-core';
import React from 'react';
import { DndProvider } from 'react-dnd';
import type { Editor } from 'slate';
import { createEditor } from 'slate';
import { describe, expect, it, vi } from 'vitest';
import { KonaEditor } from '../../editor';
import type { IPlugin } from '../../types';
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

describe('moveNode', () => {
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
  it('reorders rendered paragraphs when dropped before another block', async () => {
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
            { type: 'paragraph', children: [{ text: 'First' }] },
            { type: 'paragraph', children: [{ text: 'Second' }] },
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

    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ bottom: 100, top: 0 }),
    });

    try {
      const sourceIds = getHandlerIds(manager, 'dragSources');
      const targetIds = getHandlerIds(manager, 'dropTargets');

      expect(sourceIds).toHaveLength(2);
      expect(targetIds).toHaveLength(2);

      act(() => {
        manager.getActions().beginDrag([sourceIds[1]], {
          clientOffset: { x: 0, y: 50 },
          getSourceClientOffset: () => ({ x: 0, y: 0 }),
        });
        manager.getActions().publishDragSource();
        manager
          .getActions()
          .hover([targetIds[0]], { clientOffset: { x: 0, y: 0 } });
        expect(manager.getMonitor().canDropOnTarget(targetIds[0])).toBe(true);
        manager.getActions().drop();
        manager.getActions().endDrag();
      });
    } finally {
      Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
        configurable: true,
        value: originalRect,
      });
    }

    expect(editor?.children).toEqual([
      expect.objectContaining({
        type: 'paragraph',
        children: [{ text: 'Second' }],
      }),
      expect.objectContaining({
        type: 'paragraph',
        children: [{ text: 'First' }],
      }),
    ]);
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(editor?.children),
    );
  });
});
