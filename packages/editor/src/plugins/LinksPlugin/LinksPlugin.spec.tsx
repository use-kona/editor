// @vitest-environment jsdom

import { render } from '@testing-library/react';
import { createEditor as createSlateEditor, Transforms } from 'slate';
import { describe, expect, it, vi } from 'vitest';
import { createEditor } from '../../core/createEditor';
import { deserialize } from '../../core/deserialize';
import { isSafeLinkUrl } from '../../index';
import { Link } from './Link';
import { LinksPlugin } from './LinksPlugin';

vi.mock('slate-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('slate-react')>();

  return {
    ...actual,
    useReadOnly: () => true,
    useSlateStatic: () => createSlateEditor(),
  };
});

const createEditorWithLinks = () => {
  const plugin = new LinksPlugin({});
  const editor = createEditor([plugin])();
  editor.children = [{ type: 'paragraph', children: [{ text: '' }] }];
  Transforms.select(editor, { path: [0, 0], offset: 0 });

  return { editor, plugin };
};

describe('LinksPlugin', () => {
  it.each([
    'https://use-kona.com',
    'http://use-kona.com',
    'mailto:hello@use-kona.com',
  ])('accepts %s', (url) => {
    expect(isSafeLinkUrl(url)).toBe(true);
  });

  it('rejects javascript URLs in addLink', () => {
    const { editor } = createEditorWithLinks();

    LinksPlugin.addLink(editor, 'javascript:alert(1)');

    expect(editor.children).toEqual([
      { type: 'paragraph', children: [{ text: '' }] },
    ]);
  });

  it('rejects javascript URLs typed into the editor', () => {
    const { editor } = createEditorWithLinks();

    editor.insertText('javascript:alert(1)');

    expect(editor.children).toEqual([
      { type: 'paragraph', children: [{ text: 'javascript:alert(1)' }] },
    ]);
  });

  it('deserializes unsafe anchors as their non-link children', () => {
    const { plugin } = createEditorWithLinks();
    const document = new DOMParser().parseFromString(
      '<a href="javascript:alert(1)">legacy link</a>',
      'text/html',
    );

    expect(deserialize([plugin])(document.body)).toEqual({
      type: 'paragraph',
      children: [{ text: 'legacy link' }],
    });
  });

  it('renders legacy unsafe links without an anchor', () => {
    const { container } = render(
      <Link
        attributes={{ 'data-slate-node': 'element' }}
        element={{
          type: LinksPlugin.LINK_TYPE,
          url: 'javascript:alert(1)',
          children: [{ text: 'legacy link' }],
        }}
        renderHint={() => null}
      >
        legacy link
      </Link>,
    );

    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).toBe('legacy link');
  });
});
