import { useStore } from '@nanostores/react';
import type { Meta, StoryObj } from '@storybook/react';
import { map, type ReadableAtom } from 'nanostores';
import { type ChangeEvent, useRef, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Transforms } from 'slate';
import { useFocused } from 'slate-react';
import { DragBlock } from '../../../apps/site/examples/DragBlock';
import { ExampleEditor } from '../../../apps/site/examples/Editor';
import { getPlugins } from '../../../apps/site/examples/getPlugins';
import { DragIcon } from '../../../apps/site/examples/icons/drag';
import {
  type Task,
  type TaskElement,
  TasksPlugin,
} from '../../../apps/site/examples/plugins/TasksPlugin/TasksPlugin';
import {
  AttachmentsPlugin,
  CodeBlockPlugin,
  DnDPlugin,
  LinksPlugin,
  ListsPlugin,
  NodeIdPlugin,
} from '../src';
import type {
  CustomDropContext,
  EditorDragItem,
  EditorOuterDragItem,
} from '../src/plugins/DnDPlugin/types';
import type { CustomElement } from '../types';

const TASK_TYPE = Symbol('task');

const CustomDndBlock = (props: {
  task: Task;
  onToggle: (value: boolean) => void;
  onChange: (value: string) => void;
}) => {
  const [, drag, preview] = useDrag<EditorOuterDragItem<Task>>({
    type: TASK_TYPE,
    item() {
      return { kind: 'outer', item: props.task, items: [props.task] };
    },
    collect(monitor) {
      return {
        isDragging: monitor.isDragging(),
      };
    },
  });

  return (
    <div ref={preview} className="custom-dnd-block">
      <span className="handler" ref={drag}>
        <DragIcon size={16} />
      </span>
      <input
        type="checkbox"
        checked={props.task.value}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          props.onToggle(event.target.checked)
        }
      />
      <input
        type="text"
        value={props.task.title}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
};

type DndPoolProps = {
  $tasks: ReadableAtom;
  onDrop: (items: number[]) => void;
};

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
    nodeId: 'node-1',
    type: 'paragraph',
    children: [{ text: 'First text' }],
  },
  {
    nodeId: 'node-2',
    type: 'paragraph',
    children: [{ text: 'Second text' }],
  },
  {
    nodeId: 'node-3',
    type: 'paragraph',
    children: [{ text: '' }],
  },
  {
    nodeId: 'node-4',
    type: 'ul',
    children: [
      {
        nodeId: 'node-5',
        type: 'li',
        children: [{ text: '123' }],
      },
    ],
  },
  {
    nodeId: 'node-6',
    type: 'ul',
    children: [
      {
        nodeId: 'node-7',
        type: 'li',
        children: [{ text: '456' }],
      },
    ],
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
      `<p><a href="http://localhost">Test</a> <strong>test</strong></p><h1>Heading 1</h1><ul><li>1</li></ul>`,
      'text/html',
    );

    return (
      <div className="root">
        <ExampleEditor initialValueType="html" value={value.body} />
      </div>
    );
  },
};

export const Serialize: Story = {
  name: 'Serialize',
  render: () => {
    const ref = useRef(null);
    const [value, setValue] = useState([]);
    const [html, setHtml] = useState('');

    return (
      <div className="root">
        <button
          type="button"
          onClick={() => {
            setHtml(ref.current.serialize(value));
          }}
        >
          serialize
        </button>
        {html}
        <ExampleEditor
          ref={ref}
          initialValueType="kona-editor"
          value={defaultValue}
          onChange={(value) => {
            setValue(value);
          }}
        />
      </div>
    );
  },
};

const getCustomPlugins = ({
  documentId,
  tasksPlugin,
}: {
  documentId: string;
  tasksPlugin: TasksPlugin;
}) => {
  const plugins = getPlugins().filter((plugin) => {
    return !(plugin instanceof DnDPlugin || plugin instanceof NodeIdPlugin);
  });

  const nodeIdPlugin = new NodeIdPlugin({
    generateId: () => Math.random().toString(36).substring(2, 15),
  });

  return [
    ...plugins,
    tasksPlugin,
    nodeIdPlugin,
    new DnDPlugin({
      documentId: documentId,
      renderBlock: (params) => {
        return <DragBlock {...params} />;
      },
      onDropFiles: () => {},
      ignoreNodes: [
        CodeBlockPlugin.CODE_LINE_ELEMENT,
        ListsPlugin.BULLETED_LIST_ELEMENT,
        ListsPlugin.NUMBERED_LIST_ELEMENT,
      ],
      nodeIdPlugin,
      customTypes: {
        [TasksPlugin.TASK_ELEMENT]: {
          type: TASK_TYPE,
          getData: (element: TaskElement) => {
            return { task: { id: element.taskId } };
          },
        },
      },
      customDropHandlers: {
        [TASK_TYPE]: {
          type: TASK_TYPE,
          onDrop: ({ editor, data, insertAt }: CustomDropContext<Task>) => {
            const node: TaskElement = {
              type: TasksPlugin.TASK_ELEMENT,
              taskId: data.item.id,
              children: [{ text: data.item.title }],
            };

            Transforms.insertNodes<CustomElement>(editor, [node], {
              at: insertAt,
            });

            return 'handled';
          },
        },
      },
    }),
  ];
};

const defaultValue1 = [
  {
    nodeId: 'node-1',
    type: 'paragraph',
    children: [{ text: 'First paragraph' }],
  },
  {
    nodeId: 'node-2',
    type: 'paragraph',
    children: [{ text: 'Second paragraph' }],
  },
  {
    nodeId: 'node-3',
    type: 'paragraph',
    children: [
      { text: 'Third paragraph' },
      {
        url: 'https://google.com',
        type: LinksPlugin.LINK_TYPE,
        children: [{ text: 'link' }],
      },
      { text: 'Third paragraph' },
    ],
  },
  {
    nodeId: 'node-4',
    type: AttachmentsPlugin.ATTACHMENT_ELEMENT,
    file: {
      url: 'https://images.unsplash.com/photo-1783917053123-f68ec8e8be47?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDd8Ym84alFLVGFFMFl8fGVufDB8fHx8fA%3D%3D',
      type: 'image/jpeg',
    },
    children: [
      {
        text: '',
      },
    ],
  },
  {
    nodeId: 'node-5',
    type: 'paragraph',
    children: [{ text: 'Another line of text' }],
  },
];

const defaultValue2 = [
  {
    nodeId: 'node-a',
    type: 'paragraph',
    children: [{ text: 'A' }],
  },
  {
    nodeId: 'node-b',
    type: 'paragraph',
    children: [{ text: 'B' }],
  },
  {
    nodeId: 'node-c',
    type: 'paragraph',
    children: [{ text: 'C' }],
  },
];

export const Blocks: Story = {
  name: 'Custom Dnd blocks',
  render: () => {
    const [$tasks] = useState(() =>
      map<Record<number, Task>>({
        1: { id: 1, value: false, title: 'Task 1' },
        2: { id: 2, value: true, title: 'Task 2' },
      }),
    );
    const tasks = Object.values(useStore($tasks));

    const [tasksPlugin] = useState(
      () =>
        new TasksPlugin({
          $tasks,
          onTaskChange: (taskId, task) => {
            $tasks.setKey(taskId, {
              ...$tasks.get()[taskId],
              ...task,
            });
          },
        }),
    );

    const [document1Plugins] = useState(() =>
      getCustomPlugins({
        documentId: 'document1',
        tasksPlugin,
      }),
    );

    const [document2Plugins] = useState(() =>
      getCustomPlugins({
        documentId: 'document2',
        tasksPlugin,
      }),
    );

    return (
      <DndProvider backend={HTML5Backend}>
        <div className="root demo">
          <div className="tasks-pool">
            <span>Tasks Pool 1</span>
            {tasks.map((task) => (
              <CustomDndBlock
                key={task.id}
                task={task}
                onChange={(title) => {
                  $tasks.setKey(task.id, { ...$tasks.get()[task.id], title });
                }}
                onToggle={() => {
                  $tasks.setKey(task.id, {
                    ...$tasks.get()[task.id],
                    value: !$tasks.get()[task.id].value,
                  });
                }}
              />
            ))}
          </div>
          <ExampleEditor
            customPlugins={document1Plugins}
            initialValueType="kona-editor"
            value={defaultValue1}
            onChange={(value) => {
              console.log('editor1', value);
            }}
          />
          {/*<ExampleEditor*/}
          {/*  customPlugins={document2Plugins}*/}
          {/*  initialValueType="kona-editor"*/}
          {/*  value={defaultValue2}*/}
          {/*  onChange={(value) => {*/}
          {/*    console.log('editor2', value);*/}
          {/*  }}*/}
          {/*/>*/}
        </div>
      </DndProvider>
    );
  },
};
