// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from '@testing-library/react';
import type { WritableAtom } from 'nanostores';
import { Slate } from 'slate-react';
import { afterEach, expect, it, vi } from 'vitest';
import type { CustomElement } from '../../types';
import { useEditorContext } from '../provider';
import type { IPlugin } from '../types';
import { createEditable } from './createEditable';
import { createEditor } from './createEditor';
import styles from './styles.module.css';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const rect = (top: number, height = 30, left = 70, width = 400) =>
  new DOMRect(left, top, width, height);

const setup = () => {
  let selection!: WritableAtom<CustomElement[]>;
  const CaptureSelection = () => {
    selection = useEditorContext().selectedNodes;
    return null;
  };
  const plugins: IPlugin[] = [{ ui: () => <CaptureSelection /> }];
  const editor = createEditor(plugins)();
  const Editable = createEditable(editor, plugins);
  const value: CustomElement[] = [
    { type: 'paragraph', children: [{ text: 'First' }] },
    { type: 'paragraph', children: [{ text: 'Second' }] },
    { type: 'paragraph', children: [{ text: 'Third' }] },
    {
      type: 'list',
      children: [{ type: 'item', children: [{ text: 'Nested' }] }],
    },
  ];
  const result = render(
    <Slate editor={editor} initialValue={value}>
      <Editable />
    </Slate>,
  );
  const editable = result.container.querySelector<HTMLElement>(
    '[data-slate-editor]',
  );
  const surface = editable?.parentElement;
  if (!editable || !surface) throw new Error('Editor surface is missing');
  vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue(
    rect(100, 200, 50, 440),
  );
  const blocks = Array.from(editable.children);
  const bounds = blocks.map((block, index) =>
    vi
      .spyOn(block, 'getBoundingClientRect')
      .mockReturnValue(rect(120 + index * 30)),
  );
  const highlights = () =>
    Array.from(
      surface.querySelectorAll<HTMLElement>(`.${styles.selectionHighlight}`),
    );
  const select = (nodes: CustomElement[]) => act(() => selection.set(nodes));
  return { ...result, value, surface, blocks, bounds, highlights, select };
};

it('moves the same highlight between store selections, grows adjacent groups, and keeps gaps clear', () => {
  const { value, highlights, select } = setup();
  select([value[0]]);
  const highlight = highlights()[0];
  expect(highlight.style.transform).toBe('translate(20px, 20px)');
  expect(highlight.style.height).toBe('30px');

  select([value[1]]);
  expect(highlights()[0]).toBe(highlight);
  expect(highlight.style.transform).toBe('translate(20px, 50px)');

  // Store order does not determine visual grouping.
  select([value[2], value[1]]);
  expect(highlights()).toHaveLength(1);
  expect(highlights()[0]).toBe(highlight);
  expect(highlight.style.height).toBe('60px');

  select([value[0], value[2]]);
  expect(highlights()).toHaveLength(2);
  expect(highlights().map((node) => node.style.height)).toEqual([
    '30px',
    '30px',
  ]);
  expect(highlights().map((node) => node.style.transform)).toEqual([
    'translate(20px, 20px)',
    'translate(20px, 80px)',
  ]);

  select([]);
  expect(highlights()).toHaveLength(0);
});

it('highlights the top-level parent of a nested selection and skips collapsed blocks', () => {
  const { value, bounds, highlights, select } = setup();
  select([value[3].children[0] as CustomElement]);
  expect(highlights()).toHaveLength(1);
  expect(highlights()[0].style.transform).toBe('translate(20px, 110px)');

  bounds[1].mockReturnValue(rect(150, 0));
  select([value[0], value[1], value[2]]);
  expect(highlights()).toHaveLength(2);
  expect(highlights().map((node) => node.style.height)).toEqual([
    '30px',
    '30px',
  ]);
});

it('tracks scroll offsets, layout changes, and deletion without changing selection state', async () => {
  const { value, surface, blocks, bounds, highlights, select } = setup();
  select([value[1]]);
  const highlight = highlights()[0];

  surface.scrollTop = 40;
  bounds[1].mockReturnValue(rect(110));
  act(() => surface.dispatchEvent(new Event('scroll')));
  await waitFor(() =>
    expect(highlight.style.transform).toBe('translate(20px, 50px)'),
  );

  bounds[1].mockReturnValue(rect(140, 60, 70, 300));
  act(() => window.dispatchEvent(new Event('resize')));
  await waitFor(() => {
    expect(highlight.style.transform).toBe('translate(20px, 80px)');
    expect(highlight.style.width).toBe('300px');
    expect(highlight.style.height).toBe('60px');
  });

  act(() => blocks[1].remove());
  await waitFor(() => expect(highlights()).toHaveLength(0));
});
