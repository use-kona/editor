import { describe, expect, it } from 'vitest';
import type { IPlugin } from '../types';
import { createEditor } from './createEditor';

const block = (isSelectable?: boolean): IPlugin => ({
  blocks: [
    {
      type: 'widget',
      render: () => null,
      ...(isSelectable === undefined ? {} : { isSelectable }),
    },
  ],
});

const widget = { type: 'widget', children: [{ text: '' }] };

describe('createEditor block selectability', () => {
  it.each([true, false])('supports isSelectable: %s', (isSelectable) => {
    const editor = createEditor([block(isSelectable)])();

    expect(editor.isSelectable(widget)).toBe(isSelectable);
    expect(
      editor.isSelectable({ type: 'paragraph', children: [{ text: '' }] }),
    ).toBe(true);
  });

  it('preserves init overrides when a block has no selectability setting', () => {
    const editor = createEditor([
      {
        init(editor) {
          editor.isSelectable = (element) => element.type !== 'widget';
          return editor;
        },
      },
      block(),
    ])();

    expect(editor.isSelectable(widget)).toBe(false);
    expect(
      editor.isSelectable({ type: 'paragraph', children: [{ text: '' }] }),
    ).toBe(true);
  });

  it.each([true, false])(
    'uses the last explicit setting (%s) across matching plugins',
    (isSelectable) => {
      const editor = createEditor([
        block(!isSelectable),
        block(isSelectable),
        block(),
      ])();

      expect(editor.isSelectable(widget)).toBe(isSelectable);
    },
  );
});
