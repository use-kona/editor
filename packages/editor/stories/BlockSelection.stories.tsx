import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { Editor } from 'slate';
import { useEditorContext } from '../src/provider';
import type { IPlugin } from '../src/types';
import { ExampleEditor } from './examples/Editor';
import { getPlugins } from './examples/getPlugins';

const SelectionControls = ({ editor }: { editor: Editor }) => {
  const { selectedNodes } = useEditorContext();
  const select = (...indices: number[]) => {
    selectedNodes.set(indices.map((index) => editor.children[index]));
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 8 }}>
      <button type="button" onClick={() => select(0)}>
        First block
      </button>
      <button type="button" onClick={() => select(1)}>
        Next block
      </button>
      <button type="button" onClick={() => select(0, 1)}>
        Adjacent blocks
      </button>
      <button type="button" onClick={() => select(0, 2)}>
        Separated blocks
      </button>
      <button type="button" onClick={() => select()}>
        Clear selection
      </button>
    </div>
  );
};

const SelectionExample = () => {
  const [plugins] = useState<IPlugin[]>(() => [
    ...getPlugins(),
    { ui: ({ editor }) => <SelectionControls editor={editor} /> },
  ]);

  return (
    <ExampleEditor
      customPlugins={plugins}
      value={[
        {
          type: 'paragraph',
          children: [
            {
              text: 'Select this first block, then move the highlight to the next one.',
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              text: 'This longer block wraps onto multiple lines so the highlight changes its height as it slides. Try selecting adjacent blocks to see them share one continuous background.',
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              text: 'Separated selections keep their own highlights, leaving the block between them clear.',
            },
          ],
        },
      ]}
    />
  );
};

const meta = {
  title: 'Editor/Block selection',
  component: SelectionExample,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof SelectionExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SlidingHighlight: Story = {};
