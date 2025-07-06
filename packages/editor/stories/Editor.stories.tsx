import type { Meta, StoryObj } from '@storybook/react';
import { ExampleEditor } from '../src';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Editor',
  component: ExampleEditor,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
} satisfies Meta<typeof ExampleEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultValue = [
  {
    type: 'paragraph',
    children: [{ text: 'Default text' }],
  },
];

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  name: 'Editor',
  render: () => {
    return (
      <div className="root">
        <ExampleEditor value={defaultValue} />
      </div>
    );
  },
};

export const Deserialize: Story = {
  name: 'Deserialize',
  render: () => {
    const value = new DOMParser().parseFromString(
      `<p>Test <strong>test</strong></p><h1>Heading 1</h1><ul><li>1</li></ul>`,
      'text/html',
    );

    return (
      <div className="root">
        <ExampleEditor initialValueType="html" value={value.body} />
      </div>
    );
  },
};
