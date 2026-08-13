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
import { type Editor, Transforms } from 'slate';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KonaEditor } from '../../editor';
import type { IPlugin } from '../../types';
import { BasicFormattingPlugin } from '../BasicFormattingPlugin';
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
