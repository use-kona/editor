// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import { Editor, Transforms } from 'slate';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CustomElement } from '../../../types';
import { KonaEditor } from '../../editor';
import type { IPlugin } from '../../types';
import { BasicFormattingPlugin } from '../BasicFormattingPlugin';
import { BreaksPlugin } from '../BreaksPlugin';
import { HeadingsPlugin } from '../HeadingsPlugin';
import { CollapsibleBlocksPlugin } from './CollapsibleBlocksPlugin';

Object.assign(globalThis, { React });

const initialValue = [
  { type: HeadingsPlugin.HeadingLevel1, children: [{ text: 'Heading 1' }] },
  { type: 'paragraph', children: [{ text: 'Hidden text' }] },
  { type: HeadingsPlugin.HeadingLevel2, children: [{ text: 'Heading 2' }] },
  { type: 'paragraph', children: [{ text: 'Nested text' }] },
  { type: HeadingsPlugin.HeadingLevel1, children: [{ text: 'Next heading' }] },
  { type: 'paragraph', children: [{ text: 'Visible text' }] },
];

const plugins = () => [
  new BasicFormattingPlugin(),
  new HeadingsPlugin(),
  new CollapsibleBlocksPlugin([
    HeadingsPlugin.HeadingLevel1,
    HeadingsPlugin.HeadingLevel2,
    HeadingsPlugin.HeadingLevel3,
  ]),
];

afterEach(cleanup);

describe('CollapsibleBlocksPlugin', () => {
  it('hides nested configured blocks until the next equal-or-higher boundary and persists the collapsed state', async () => {
    const onChange = vi.fn();

    render(
      <KonaEditor
        initialValue={initialValue}
        plugins={plugins()}
        onChange={onChange}
      />,
    );

    const [firstChevron] = screen.getAllByRole('button', {
      name: 'Collapse section',
    });
    const hiddenText = screen.getByText('Hidden text');

    fireEvent.click(firstChevron);

    await waitFor(() => expect(hiddenText).not.toBeVisible());
    expect(screen.getByText('Heading 2')).not.toBeVisible();
    expect(screen.getByText('Nested text')).not.toBeVisible();
    expect(screen.getByText('Next heading')).toBeVisible();
    expect(screen.getByText('Visible text')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Expand section' }),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(onChange).toHaveBeenLastCalledWith([
      {
        type: HeadingsPlugin.HeadingLevel1,
        collapsed: true,
        children: [{ text: 'Heading 1' }],
      },
      ...initialValue.slice(1),
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Expand section' }));
    await waitFor(() => expect(screen.getByText('Hidden text')).toBeVisible());
    expect(
      screen.getAllByRole('button', { name: 'Collapse section' })[0],
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders chevrons for adjacent and empty sections', () => {
    render(
      <KonaEditor
        initialValue={[
          { type: HeadingsPlugin.HeadingLevel1, children: [{ text: 'One' }] },
          { type: HeadingsPlugin.HeadingLevel2, children: [{ text: 'Two' }] },
        ]}
        plugins={plugins()}
        onChange={() => {}}
      />,
    );

    expect(
      screen.getAllByRole('button', { name: 'Collapse section' }),
    ).toHaveLength(2);
  });

  it('renders inside later block wrappers regardless of plugin array order', () => {
    const wrapperPlugin: IPlugin = {
      renderBlock: (props) => (
        <div data-testid="block-wrapper">{props.children}</div>
      ),
    };

    render(
      <KonaEditor
        initialValue={[
          { type: HeadingsPlugin.HeadingLevel1, children: [{ text: 'One' }] },
        ]}
        plugins={[wrapperPlugin, ...plugins()]}
        onChange={() => {}}
      />,
    );

    expect(
      screen
        .getByRole('button', { name: 'Collapse section' })
        .closest('[data-testid="block-wrapper"]'),
    ).toBeInTheDocument();
  });

  it('keeps chevrons interactive in read-only editors', async () => {
    const onChange = vi.fn();

    render(
      <KonaEditor
        initialValue={initialValue}
        plugins={plugins()}
        readOnly
        onChange={onChange}
      />,
    );

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Collapse section' })[0],
    );

    await waitFor(() =>
      expect(screen.getByText('Hidden text')).not.toBeVisible(),
    );
    expect(onChange).toHaveBeenCalled();
  });

  it('moves a hidden section selection back to its boundary', () => {
    let editor: Editor | undefined;
    const capturePlugin: IPlugin = {
      init(value) {
        editor = value;
        return value;
      },
    };

    render(
      <KonaEditor
        initialValue={initialValue}
        plugins={[...plugins(), capturePlugin]}
        onChange={() => {}}
      />,
    );

    if (!editor) {
      throw new Error('Expected editor to be initialized');
    }

    act(() => {
      Transforms.select(editor, { path: [1, 0], offset: 2 });
    });
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Collapse section' })[0],
    );

    expect(editor.selection).toEqual({
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 0 },
    });
  });

  it('keeps a selection in the next equal-level section in place', () => {
    let editor: Editor | undefined;
    const capturePlugin: IPlugin = {
      init(value) {
        editor = value;
        return value;
      },
    };

    render(
      <KonaEditor
        initialValue={initialValue}
        plugins={[...plugins(), capturePlugin]}
        onChange={() => {}}
      />,
    );

    if (!editor) {
      throw new Error('Expected editor to be initialized');
    }

    act(() => {
      Transforms.select(editor, { path: [4, 0], offset: 2 });
    });
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Collapse section' })[0],
    );

    expect(editor.selection).toEqual({
      anchor: { path: [4, 0], offset: 2 },
      focus: { path: [4, 0], offset: 2 },
    });
  });
});

describe('Enter in collapsed sections', () => {
  const headingTypes = [
    HeadingsPlugin.HeadingLevel1,
    HeadingsPlugin.HeadingLevel2,
    HeadingsPlugin.HeadingLevel3,
  ];

  const renderEditor = (value: CustomElement[]) => {
    let editor: Editor | undefined;
    const capturePlugin: IPlugin = {
      init(value) {
        editor = value;
        return value;
      },
    };
    const { container, unmount } = render(
      <KonaEditor
        initialValue={value}
        plugins={[
          ...plugins(),
          new BreaksPlugin({ breakNodes: headingTypes }),
          capturePlugin,
        ]}
        onChange={() => {}}
      />,
    );

    if (!editor) throw new Error('Expected editor to be initialized');

    return { editor, container, cleanup: unmount };
  };

  it.each(headingTypes)(
    'expands collapsed %s when Enter creates a paragraph after it',
    async (type) => {
      const { editor, container, cleanup } = renderEditor([
        {
          type,
          collapsed: true,
          children: [{ text: 'Heading' }],
        },
        { type: 'paragraph', children: [{ text: 'Existing content' }] },
      ]);

      try {
        expect(container.querySelector('[hidden]')).not.toBeNull();

        await act(async () => {
          Transforms.select(editor, Editor.end(editor, [0]));
          editor.insertBreak();
          editor.insertText('New content');
        });

        expect(editor.children[0]).toMatchObject({ collapsed: false });
        expect(editor.children[1]).toMatchObject({
          type: 'paragraph',
          children: [{ text: 'New content' }],
        });
        expect(container.querySelector('[hidden]')).toBeNull();
        expect(container.textContent).toContain('New content');
        expect(
          container
            .querySelector('[aria-label="Collapse section"]')
            ?.getAttribute('aria-expanded'),
        ).toBe('true');
      } finally {
        cleanup();
      }
    },
  );

  it('keeps a section collapsed when Enter inserts a paragraph before its heading', async () => {
    const { editor, container, cleanup } = renderEditor([
      {
        type: HeadingsPlugin.HeadingLevel1,
        collapsed: true,
        children: [{ text: 'Heading' }],
      },
      { type: 'paragraph', children: [{ text: 'Existing content' }] },
    ]);

    try {
      await act(async () => {
        Transforms.select(editor, Editor.start(editor, [0]));
        editor.insertBreak();
      });

      expect(editor.children[0]).toMatchObject({ type: 'paragraph' });
      expect(editor.children[1]).toMatchObject({ collapsed: true });
      expect(container.querySelectorAll('[hidden]')).toHaveLength(1);
    } finally {
      cleanup();
    }
  });

  it('expands the edited section while preserving nested and adjacent collapsed sections', async () => {
    const { editor, container, cleanup } = renderEditor([
      {
        type: HeadingsPlugin.HeadingLevel1,
        collapsed: true,
        children: [{ text: 'Heading' }],
      },
      {
        type: HeadingsPlugin.HeadingLevel2,
        collapsed: true,
        children: [{ text: 'Nested heading' }],
      },
      { type: 'paragraph', children: [{ text: 'Nested content' }] },
      {
        type: HeadingsPlugin.HeadingLevel1,
        collapsed: true,
        children: [{ text: 'Adjacent heading' }],
      },
      { type: 'paragraph', children: [{ text: 'Adjacent content' }] },
    ]);

    try {
      await act(async () => {
        Transforms.select(editor, Editor.end(editor, [0]));
        editor.insertBreak();
        editor.insertText('New content');
      });

      expect(editor.children[0]).toMatchObject({ collapsed: false });
      expect(editor.children[2]).toMatchObject({ collapsed: true });
      expect(editor.children[4]).toMatchObject({ collapsed: true });
      expect(container.querySelectorAll('[hidden]')).toHaveLength(2);
      expect(
        container.querySelectorAll('[aria-label="Expand section"]'),
      ).toHaveLength(2);
    } finally {
      cleanup();
    }
  });
});
