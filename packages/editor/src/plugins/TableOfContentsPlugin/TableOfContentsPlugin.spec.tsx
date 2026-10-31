// @vitest-environment jsdom

import { act, cleanup, render } from '@testing-library/react';
import React from 'react';
import { Transforms } from 'slate';
import { afterEach, describe, expect, it } from 'vitest';
import type { CustomElement } from '../../../types';
import { createEditor } from '../../core/createEditor';
import { EmojiPlugin } from '../EmojiPlugin';
import type { EmojiElement } from '../EmojiPlugin/types';
import styles from './styles.module.css';
import { TableOfContentsPlugin } from './TableOfContentsPlugin';

Object.assign(globalThis, { React });

afterEach(cleanup);

const emoji = (id: string): EmojiElement => ({
  type: 'emoji',
  emoji: id,
  children: [{ text: '' }],
});

const renderContents = (
  children: CustomElement['children'],
  renderEmoji?: (id: string) => React.ReactNode,
) => {
  const plugin = new TableOfContentsPlugin({
    levels: { heading1: 1 },
    renderEmoji,
  });
  const editor = createEditor([
    new EmojiPlugin({
      onSearch: () => {},
      renderMenu: () => null,
      renderEmoji: renderEmoji ?? (() => null),
    }),
    plugin,
  ])();
  editor.children = [{ type: 'heading1', children }];

  const Contents = () => plugin.ui({ editor, readOnly: false, children: null });
  const { container } = render(<Contents />);

  return { contents: container.querySelector(`.${styles.max}`), editor };
};

describe('TableOfContentsPlugin', () => {
  it('renders inline emojis and all heading text in order', () => {
    const { contents } = renderContents(
      [
        { text: '' },
        emoji('rocket'),
        { text: ' Launch ' },
        emoji('tada'),
        { text: ' plans' },
      ],
      (id) => <span data-emoji={id}>{id === 'rocket' ? '🚀' : '🎉'}</span>,
    );

    expect(contents?.textContent).toBe('🚀 Launch 🎉 plans');
    expect(contents?.querySelectorAll('[data-emoji]')).toHaveLength(2);
  });

  it('preserves text from every leaf and nested inline without an emoji renderer', () => {
    const { contents } = renderContents([
      { text: 'Release ' },
      { text: 'notes ' },
      {
        type: 'link',
        children: [{ text: 'for ' }, { text: 'today' }],
      },
      emoji('rocket'),
      { text: ' 🚀' },
    ]);

    expect(contents?.textContent).toBe('Release notes for today 🚀');
    expect(contents?.querySelector('a')).toBeNull();
  });

  it('renders an emoji-only heading', () => {
    const { contents } = renderContents(
      [{ text: '' }, emoji('rocket'), { text: '' }],
      () => '🚀',
    );

    expect(contents?.textContent).toBe('🚀');
  });

  it('updates the label when heading text and emojis change', async () => {
    const { contents, editor } = renderContents(
      [{ text: 'Launch ' }, emoji('rocket'), { text: ' plans' }],
      (id) => (id === 'rocket' ? '🚀' : '🎉'),
    );

    await act(async () => {
      Transforms.insertText(editor, 'New ', {
        at: { path: [0, 0], offset: 0 },
      });
      Transforms.setNodes<EmojiElement>(
        editor,
        { emoji: 'tada' },
        { at: [0, 1] },
      );
    });

    expect(contents?.textContent).toBe('New Launch 🎉 plans');
  });
});
