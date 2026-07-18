import { useStore } from '@nanostores/react';
import type { MapStore } from 'nanostores';
import type { ChangeEvent } from 'react';
import { Editor, Node } from 'slate';
import type { DOMEditor } from 'slate-dom';
import { ReactEditor, useSlateStatic } from 'slate-react';
import type {
  CustomElement,
  IPlugin,
} from '../../../../../packages/editor/src';

type TasksPluginOptions = {
  $tasks: MapStore<Record<number, Task>>;
  onTaskChange: (taskId: number, task: Partial<Task>) => void;
};

const TASK_ELEMENT = 'task';

export type TaskElement = CustomElement & {
  taskId: number;
};

export type Task = {
  id: number;
  value: boolean;
  title: string;
};

export class TasksPlugin implements IPlugin {
  constructor(private options: TasksPluginOptions) {}

  static TASK_ELEMENT = 'task';

  init(editor) {
    const { onChange } = editor;

    editor.onChange = async (...args) => {
      const isAstChange = editor.operations.some(
        (op) => 'set_selection' !== op.type,
      );

      if (isAstChange) {
        const entity = Editor.above<TaskElement>(editor, {
          match: (n: CustomElement) =>
            Editor.isBlock(editor, n) && n.type === TasksPlugin.TASK_ELEMENT,
          mode: 'lowest',
        });

        if (entity) {
          const task: TaskElement = entity[0];
          const nodeId = task.taskId;

          if (nodeId) {
            const title = Node.string(task).split('\n')[0];
            this.options.onTaskChange(nodeId, {
              title,
            });
          }
        }
      }

      try {
        await onChange(...args);
      } finally {
      }
    };
    return editor;
  }

  blocks = [
    {
      type: TASK_ELEMENT,
      render: (props) => {
        const { element } = props;
        const editor = useSlateStatic();
        const taskId = element.taskId;

        const tasks = useStore(this.options.$tasks);

        return (
          <div className="task" {...props.attributes}>
            <span contentEditable={false}>
              <input
                type="checkbox"
                checked={tasks[taskId]?.value}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  this.options.onTaskChange(taskId, {
                    value: event.target.checked,
                  });
                }}
              />
            </span>
            {props.children}
          </div>
        );
      },
    },
  ];
}
