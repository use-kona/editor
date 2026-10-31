// @vitest-environment jsdom

import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { createDragDropManager } from 'dnd-core';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import { Editor, Node, Transforms } from 'slate';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CustomElement } from '../../../types';
import { KonaEditor } from '../../editor';
import type { IPlugin } from '../../types';
import { CollapsibleBlocksPlugin } from '../CollapsibleBlocksPlugin';
import { HeadingsPlugin } from '../HeadingsPlugin';
import { ListsPlugin } from '../ListsPlugin';
import { NodeIdPlugin } from '../NodeIdPlugin';
import { DnDPlugin } from './DnDPlugin';
import type { EditorInnerDragItem, Options } from './types';

Object.assign(globalThis, { React });

const paragraph = (text: string, nodeId?: string) => ({
  type: 'paragraph',
  ...(nodeId === undefined ? {} : { nodeId }),
  children: [{ text }],
});

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 100, 100),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const setup = (
  documents: {
    value: CustomElement[];
    options?: Partial<Options>;
    plugins?: IPlugin[];
  }[],
) => {
  const sources = new WeakMap<HTMLElement, string>();
  const targets = new WeakMap<HTMLElement, string>();
  const manager = createDragDropManager(() => ({
    setup() {},
    teardown() {},
    profile: () => ({}),
    connectDragSource(id: string, element: HTMLElement) {
      sources.set(element, id);
      return () => sources.delete(element);
    },
    connectDragPreview: () => () => {},
    connectDropTarget(id: string, element: HTMLElement) {
      targets.set(element, id);
      return () => targets.delete(element);
    },
  }));
  const editors: Editor[] = [];
  const plugins = documents.map((document, index) => [
    ...(document.plugins || []),
    new DnDPlugin({
      onDropFiles() {},
      ...document.options,
      renderBlock: ({
        props,
        dragRef,
        previewRef,
        dropRef,
        onToggleSelected,
        onNativeDrop,
      }) => (
        <div
          {...props.attributes}
          data-test-block={Node.string(props.element)}
          ref={(element) => {
            if (typeof props.attributes.ref === 'function')
              props.attributes.ref(element);
            else if (props.attributes.ref)
              props.attributes.ref.current = element;
            dropRef(previewRef(element));
          }}
          onDrop={onNativeDrop}
        >
          <button
            type="button"
            contentEditable={false}
            data-drag
            ref={(element) => {
              dragRef(element);
            }}
          >
            Drag
          </button>
          <button
            type="button"
            contentEditable={false}
            data-select
            onClick={onToggleSelected}
          >
            Select
          </button>
          {props.children}
        </div>
      ),
    }),
    {
      init(editor) {
        editors[index] = editor;
        return editor;
      },
    } satisfies IPlugin,
  ]);
  const view = render(
    <DndProvider manager={manager}>
      {documents.map((document, index) => (
        <section key={index} data-document={index}>
          <KonaEditor
            initialValue={document.value}
            plugins={plugins[index]}
            onChange={() => {}}
          />
        </section>
      ))}
    </DndProvider>,
  );
  const block = (text: string, document = 0) => {
    const element = Array.from(
      view.container.querySelectorAll<HTMLElement>(
        `[data-document="${document}"] [data-test-block]`,
      ),
    ).find((element) => element.dataset.testBlock === text);
    if (!element) throw new Error(`Block ${text} not found`);
    return element;
  };
  const select = (text: string, document = 0) => {
    const button = block(text, document).querySelector<HTMLElement>(
      ':scope > [data-select]',
    );
    if (!button) throw new Error('Select button not found');
    fireEvent.click(button);
  };
  const begin = (text: string, document = 0) => {
    const button = block(text, document).querySelector<HTMLElement>(
      ':scope > [data-drag]',
    );
    const id = button && sources.get(button);
    if (!id) throw new Error('Drag source not found');
    act(() => {
      manager.getActions().beginDrag([id], {
        clientOffset: { x: 0, y: 50 },
        getSourceClientOffset: () => ({ x: 0, y: 0 }),
      });
      manager.getActions().publishDragSource();
    });
    return manager.getMonitor().getItem<EditorInnerDragItem>();
  };
  const drop = async (
    text: string,
    { document = 0, copy = false, y = 100 } = {},
  ) => {
    const element = block(text, document);
    const id = targets.get(element);
    if (!id) throw new Error('Drop target not found');
    fireEvent(
      element,
      Object.assign(new Event('drop', { bubbles: true, cancelable: true }), {
        altKey: copy,
      }),
    );
    const ids = [id];
    for (
      let parent = element.parentElement;
      parent;
      parent = parent.parentElement
    ) {
      const parentId = targets.get(parent);
      if (parentId) ids.unshift(parentId);
    }
    act(() => {
      manager.getActions().hover(ids, { clientOffset: { x: 0, y } });
    });
    await act(async () => {
      manager.getActions().drop();
    });
  };
  const beginExternal = (type: string | symbol, item: object) => {
    const id = manager.getRegistry().addSource(type, {
      canDrag: () => true,
      isDragging: (monitor, sourceId) => monitor.getSourceId() === sourceId,
      beginDrag: () => item,
      endDrag() {},
    });
    act(() => manager.getActions().beginDrag([id]));
  };
  const end = () => act(() => manager.getActions().endDrag());
  const texts = (document = 0) => editors[document].children.map(Node.string);
  return {
    ...view,
    editors,
    block,
    select,
    begin,
    beginExternal,
    drop,
    end,
    texts,
    manager,
  };
};

describe('DnD without node IDs', () => {
  it('moves initial ID-less selections with NodeIdPlugin installed', async () => {
    let sequence = 0;
    const view = setup([
      {
        value: ['A', 'B', 'C'].map((text) => paragraph(text)),
        plugins: [new NodeIdPlugin({ generateId: () => `node-${++sequence}` })],
      },
    ]);
    view.select('A');
    view.select('B');
    view.begin('A');
    await view.drop('C');
    view.end();
    expect(view.texts()).toEqual(['C', 'A', 'B']);
  });

  it.each([
    {
      initial: ['A', 'C', 'X', 'B', 'Y'],
      y: 0,
      expected: ['X', 'A', 'C', 'B', 'Y'],
    },
    {
      initial: ['X', 'B', 'Y', 'A', 'C'],
      y: 100,
      expected: ['X', 'B', 'A', 'C', 'Y'],
    },
    {
      initial: ['A', 'X', 'C', 'B', 'Y'],
      y: 100,
      expected: ['X', 'B', 'A', 'C', 'Y'],
    },
    {
      initial: ['A', 'X', 'B', 'Y', 'C'],
      y: 0,
      expected: ['X', 'A', 'C', 'B', 'Y'],
    },
  ])(
    'moves selected blocks in document order ($initial, y=$y)',
    async ({ initial, y, expected }) => {
      const view = setup([{ value: initial.map((text) => paragraph(text)) }]);
      view.select('C');
      view.select('A');
      expect(view.begin('A').nodes.map(Node.string)).toEqual(['A', 'C']);
      await view.drop('B', { y });
      view.end();
      expect(view.texts()).toEqual(expected);
      expect(Editor.pathRefs(view.editors[0]).size).toBe(0);
    },
  );

  it('does not use duplicate IDs to include unselected blocks', async () => {
    const view = setup([
      {
        value: ['A', 'B', 'C', 'D'].map((text) => paragraph(text, 'duplicate')),
      },
    ]);
    view.select('A');
    view.select('B');
    expect(view.begin('A').nodes.map(Node.string)).toEqual(['A', 'B']);
    await view.drop('D');
    view.end();
    expect(view.texts()).toEqual(['C', 'D', 'A', 'B']);
  });

  it('drags only the handle block when it is outside the selection', async () => {
    const view = setup([
      { value: ['A', 'B', 'C', 'D'].map((text) => paragraph(text)) },
    ]);
    view.select('A');
    expect(view.begin('B').nodes.map(Node.string)).toEqual(['B']);
    await view.drop('D');
    view.end();
    expect(view.texts()).toEqual(['A', 'C', 'D', 'B']);
  });

  it('tracks insertions, edits, and deletion of part of the selection during a drag', async () => {
    const view = setup([
      { value: ['A', 'B', 'C', 'D'].map((text) => paragraph(text)) },
    ]);
    view.select('A');
    view.select('B');
    view.begin('A');
    expect(Editor.pathRefs(view.editors[0]).size).toBe(2);
    act(() => {
      Transforms.insertNodes(view.editors[0], paragraph('Intro'), { at: [0] });
      Transforms.insertText(view.editors[0], '!', {
        at: { path: [1, 0], offset: 1 },
      });
      Transforms.removeNodes(view.editors[0], { at: [2] });
    });
    await view.drop('D');
    expect(Editor.pathRefs(view.editors[0]).size).toBe(0);
    view.end();
    expect(view.texts()).toEqual(['Intro', 'C', 'D', 'A!']);
  });

  it.each(['cancel', 'delete', 'self', 'unmount'] as const)(
    'releases drag references after %s',
    async (action) => {
      const view = setup([
        { value: ['A', 'B', 'C'].map((text) => paragraph(text)) },
      ]);
      view.select('A');
      view.select('B');
      view.begin('A');
      expect(Editor.pathRefs(view.editors[0]).size).toBe(2);
      if (action === 'delete') {
        act(() => {
          Transforms.removeNodes(view.editors[0], { at: [1] });
          Transforms.removeNodes(view.editors[0], { at: [0] });
        });
        await view.drop('C');
        expect(view.texts()).toEqual(['C']);
      } else if (action === 'self') {
        await view.drop('B');
        expect(view.texts()).toEqual(['A', 'B', 'C']);
      } else if (action === 'unmount') {
        view.unmount();
      }
      view.end();
      expect(Editor.pathRefs(view.editors[0]).size).toBe(0);
    },
  );

  it.each([false, true])(
    'deduplicates selected parents and descendants (self-drop=%s)',
    async (self) => {
      const parent = {
        type: 'container',
        children: [paragraph('A'), paragraph('B')],
      };
      const view = setup([{ value: [parent, paragraph('Target')] }]);
      view.select('AB');
      view.select('A');
      expect(view.begin('A').nodes.map(Node.string)).toEqual(['AB']);
      await view.drop(self ? 'B' : 'Target');
      view.end();
      expect(view.texts()).toEqual(self ? ['AB', 'Target'] : ['Target', 'AB']);
      expect(
        view.editors[0].children.find((node) => node.type === 'container'),
      ).toEqual(parent);
    },
  );

  it('reorders multiple nested list items without IDs', async () => {
    const view = setup([
      {
        value: [
          {
            type: 'ul',
            children: ['A', 'C', 'X', 'B', 'Y'].map((text) => ({
              ...paragraph(text),
              type: 'li',
            })),
          },
        ],
        plugins: [new ListsPlugin()],
      },
    ]);
    view.select('C');
    view.select('A');
    view.begin('A');
    await view.drop('B');
    view.end();
    expect(view.editors[0].children[0].children.map(Node.string)).toEqual([
      'X',
      'B',
      'A',
      'C',
      'Y',
    ]);
  });

  it.each([false, true])(
    'tracks an entire section during a drag (collapsed=%s)',
    async (collapsed) => {
      const section = { ...paragraph('Section'), type: 'heading1', collapsed };
      const view = setup([
        {
          value: [
            section,
            paragraph('Content'),
            { ...paragraph('Next'), type: 'heading1' },
          ],
          plugins: [
            new HeadingsPlugin(),
            new CollapsibleBlocksPlugin(['heading1']),
          ],
        },
      ]);
      expect(view.begin('Section').nodes.map(Node.string)).toEqual([
        'Section',
        'Content',
      ]);
      act(() =>
        Transforms.insertNodes(view.editors[0], paragraph('Intro'), {
          at: [0],
        }),
      );
      await view.drop('Next');
      view.end();
      expect(view.texts()).toEqual(['Intro', 'Next', 'Section', 'Content']);
      expect(view.editors[0].children[2]).toEqual(section);
    },
  );
});

describe('DnD between editors and copying', () => {
  it.each([undefined, null, ''] as const)(
    'moves ID-less selections between unrelated editors (documentId=%s)',
    async (documentId) => {
      const view = setup([
        {
          value: ['A', 'B', 'C'].map((text) => paragraph(text)),
          options: { documentId },
        },
        {
          value: ['X', 'Y'].map((text) => paragraph(text)),
          options: { documentId },
        },
      ]);
      view.select('B');
      view.select('A');
      view.begin('A');
      act(() =>
        Transforms.insertNodes(view.editors[0], paragraph('Intro'), {
          at: [0],
        }),
      );
      await view.drop('X', { document: 1 });
      view.end();
      expect(view.texts(0)).toEqual(['Intro', 'C']);
      expect(view.texts(1)).toEqual(['X', 'A', 'B', 'Y']);
      expect(Editor.pathRefs(view.editors[0]).size).toBe(0);
    },
  );

  it.each([
    { different: false, withIds: false },
    { different: true, withIds: false },
    { different: false, withIds: true },
    { different: true, withIds: true },
  ])(
    'copies without requiring an ID generator (different=$different, IDs=$withIds)',
    async ({ different, withIds }) => {
      const value = [
        paragraph('A', withIds ? 'a' : undefined),
        paragraph('B', withIds ? 'b' : undefined),
      ];
      const view = setup(
        different ? [{ value }, { value: [paragraph('X')] }] : [{ value }],
      );
      view.select('A');
      view.begin('A');
      await view.drop(different ? 'X' : 'B', {
        document: different ? 1 : 0,
        copy: true,
      });
      view.end();
      expect(view.texts(0)).toEqual(different ? ['A', 'B'] : ['A', 'B', 'A']);
      const target = view.editors[different ? 1 : 0];
      expect(Node.get(target, [target.children.length - 1])).toEqual(
        paragraph('A'),
      );
      expect(Node.get(view.editors[0], [0])).toEqual(value[0]);
    },
  );

  it.each([false, true])(
    'regenerates IDs recursively when configured (different editor=%s)',
    async (different) => {
      let sequence = 0;
      const nodeIdPlugin = new NodeIdPlugin({
        generateId: () => `new-${++sequence}`,
      });
      const parent = {
        type: 'container',
        nodeId: 'parent',
        children: [paragraph('A', 'a'), paragraph('B', 'b')],
      };
      const options = { nodeIdPlugin };
      const view = setup(
        different
          ? [{ value: [parent] }, { value: [paragraph('X')], options }]
          : [{ value: [parent, paragraph('X')], options }],
      );
      view.begin('AB');
      await view.drop('X', { document: different ? 1 : 0, copy: true });
      view.end();
      expect(view.editors[0].children[0]).toEqual(parent);
      const target = view.editors[different ? 1 : 0];
      expect(Node.get(target, [target.children.length - 1])).toEqual({
        type: 'container',
        nodeId: 'new-1',
        children: [paragraph('A', 'new-2'), paragraph('B', 'new-3')],
      });
    },
  );

  it('maps moves between views of the same document by ID, not source path', async () => {
    const view = setup([
      {
        value: [paragraph('A', 'a'), paragraph('B', 'b'), paragraph('C', 'c')],
        options: { documentId: 'shared' },
      },
      {
        value: [
          paragraph('Intro', 'intro'),
          paragraph('A', 'a'),
          paragraph('B', 'b'),
          paragraph('C', 'c'),
        ],
        options: { documentId: 'shared' },
      },
    ]);
    view.select('A');
    view.select('B');
    view.begin('A');
    await view.drop('C', { document: 1 });
    view.end();
    expect(view.texts(1)).toEqual(['Intro', 'C', 'A', 'B']);
    // The collaboration provider, absent in this fixture, propagates this move.
    expect(view.texts(0)).toEqual(['A', 'B', 'C']);
  });

  it.each([false, true])(
    'maps section content by ID between views (collapsed=%s)',
    async (collapsed) => {
      const section = {
        ...paragraph('Section', 'section'),
        type: 'heading1',
        collapsed,
      };
      const value = [
        section,
        paragraph('Content', 'content'),
        { ...paragraph('Next', 'next'), type: 'heading1' },
      ];
      const view = setup([
        {
          value: structuredClone(value),
          options: { documentId: 'shared' },
          plugins: [
            new HeadingsPlugin(),
            new CollapsibleBlocksPlugin(['heading1']),
          ],
        },
        {
          value: [paragraph('Intro', 'intro'), ...structuredClone(value)],
          options: { documentId: 'shared' },
          plugins: [
            new HeadingsPlugin(),
            new CollapsibleBlocksPlugin(['heading1']),
          ],
        },
      ]);
      view.begin('Section');
      await view.drop('Next', { document: 1 });
      view.end();
      expect(view.texts(0)).toEqual(['Section', 'Content', 'Next']);
      expect(view.texts(1)).toEqual(['Intro', 'Next', 'Section', 'Content']);
      expect(view.editors[1].children[2]).toEqual(section);
      expect(Editor.pathRefs(view.editors[0]).size).toBe(0);
    },
  );

  it.each(['absent', 'partial', 'duplicate', 'duplicate-source'] as const)(
    'does not guess paths with an invalid same-document ID mapping (%s)',
    async (mapping) => {
      const withIds = mapping !== 'absent';
      const view = setup([
        {
          value: [
            paragraph('A', withIds ? 'a' : undefined),
            paragraph(
              'B',
              withIds
                ? mapping === 'duplicate-source'
                  ? 'a'
                  : 'b'
                : undefined,
            ),
          ],
          options: { documentId: 'shared' },
        },
        {
          value: [
            paragraph('X', withIds ? 'a' : undefined),
            paragraph('Y', mapping === 'duplicate' ? 'a' : undefined),
          ],
          options: { documentId: 'shared' },
        },
      ]);
      view.select('A');
      view.select('B');
      view.begin('A');
      await view.drop('Y', { document: 1 });
      view.end();
      expect(view.texts(0)).toEqual(['A', 'B']);
      expect(view.texts(1)).toEqual(['X', 'Y']);
      expect(Editor.pathRefs(view.editors[0]).size).toBe(0);
    },
  );

  it('transfers current content rather than a stale drag snapshot', async () => {
    const view = setup([
      { value: ['A', 'B', 'C'].map((text) => paragraph(text)) },
      { value: [paragraph('X')] },
    ]);
    view.select('A');
    view.select('B');
    view.begin('A');
    act(() => {
      Transforms.insertText(view.editors[0], '!', {
        at: { path: [0, 0], offset: 1 },
      });
      Transforms.removeNodes(view.editors[0], { at: [1] });
    });
    await view.drop('X', { document: 1 });
    view.end();
    expect(view.texts(0)).toEqual(['C']);
    expect(view.texts(1)).toEqual(['X', 'A!']);
  });

  it('lets a destination NodeIdPlugin assign fresh IDs without passing it to DnD', async () => {
    let sequence = 0;
    const nodeIdPlugin = new NodeIdPlugin({
      generateId: () => `destination-${++sequence}`,
    });
    const view = setup([
      { value: [paragraph('A', 'a'), paragraph('B', 'b')] },
      { value: [paragraph('X', 'x')], plugins: [nodeIdPlugin] },
    ]);
    view.begin('A');
    await view.drop('X', { document: 1 });
    view.end();
    expect(view.texts(0)).toEqual(['B']);
    expect(Node.get(view.editors[1], [1])).toEqual(
      paragraph('A', 'destination-1'),
    );
  });

  it('keeps custom item data, including application IDs, in document order', async () => {
    const type = Symbol('task');
    const getData = vi.fn((node: CustomElement) => ({
      title: Node.string(node),
      nodeId: 'nodeId' in node ? node.nodeId : null,
    }));
    const view = setup([
      {
        value: [paragraph('A', 'a'), paragraph('B', 'b'), paragraph('C', 'c')],
        options: { customTypes: { paragraph: { type, getData } } },
      },
    ]);
    view.select('B');
    view.select('A');
    const item = view.begin('A');
    expect(item.item).toEqual({ title: 'A', nodeId: 'a' });
    expect(item.items).toEqual([
      { title: 'A', nodeId: 'a' },
      { title: 'B', nodeId: 'b' },
    ]);
    await view.drop('C');
    view.end();
    expect(view.texts()).toEqual(['C', 'A', 'B']);
  });

  it('handles external custom items once when nested targets bubble', async () => {
    const type = Symbol('task');
    const onDrop = vi.fn(({ editor, data, insertAt }) => {
      Transforms.insertNodes(editor, paragraph(data.item.title), {
        at: insertAt,
      });
      return 'handled' as const;
    });
    const view = setup([
      {
        value: [
          { type: 'container', children: [paragraph('A'), paragraph('B')] },
        ],
        options: {
          customTypes: { paragraph: { type } },
          customDropHandlers: { [type]: { type, onDrop } },
        },
      },
    ]);
    view.beginExternal(type, {
      kind: 'outer',
      item: { title: 'Task' },
      items: [{ title: 'Task' }],
    });
    await view.drop('A');
    view.end();
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(view.editors[0].children[0].children.map(Node.string)).toEqual([
      'A',
      'Task',
      'B',
    ]);
  });

  it('keeps native file drops working', async () => {
    const onDropFiles = vi.fn();
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const view = setup([{ value: [paragraph('A')], options: { onDropFiles } }]);
    view.beginExternal(NativeTypes.FILE, { files: [file] });
    await view.drop('A');
    view.end();
    expect(onDropFiles).toHaveBeenCalledExactlyOnceWith(
      view.editors[0],
      [file],
      [1],
    );
  });
});
