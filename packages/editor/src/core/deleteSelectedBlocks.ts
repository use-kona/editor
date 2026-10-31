import { Editor, Element, Transforms } from 'slate';
import { HistoryEditor } from 'slate-history';
import type { CustomElement } from '../../types';
import type { IPlugin } from '../types';

export const deleteSelectedBlocks = async (
  editor: Editor,
  plugins: IPlugin[],
  selectedNodes: CustomElement[],
) => {
  const selected = new Set(selectedNodes);
  const entries = Array.from(
    Editor.nodes<CustomElement>(editor, {
      at: [],
      match: (node) =>
        Element.isElement(node) &&
        Editor.isBlock(editor, node) &&
        selected.has(node),
      mode: 'highest',
      voids: true,
    }),
  );
  if (!entries.length) return false;

  // Keep paths current while asynchronous deletion hooks are pending.
  const targets = entries.map(([node, path]) => ({
    node,
    ref: Editor.pathRef(editor, path),
    block: plugins
      .flatMap((plugin) => plugin.blocks || [])
      .find((block) => block.type === node.type),
  }));

  try {
    // A veto keeps the whole selection intact.
    for (const { node, block } of targets) {
      if (block?.onBeforeDelete && !(await block.onBeforeDelete([node]))) {
        return false;
      }
    }

    const removed: typeof targets = [];
    const remove = () =>
      Editor.withoutNormalizing(editor, () => {
        for (const target of [...targets].reverse()) {
          const path = target.ref.current;
          if (!path) continue;
          Transforms.removeNodes(editor, { at: path, voids: true });
          removed.push(target);
        }
        if (!editor.children.length) {
          Transforms.insertNodes(
            editor,
            { type: 'paragraph', children: [{ text: '' }] },
            { at: [0] },
          );
        }
        if (!editor.selection) {
          Transforms.select(editor, Editor.start(editor, []));
        }
      });

    if (HistoryEditor.isHistoryEditor(editor)) {
      HistoryEditor.withNewBatch(editor, remove);
    } else {
      remove();
    }
    for (const { node, block } of removed) block?.onDelete?.([node]);
    return true;
  } finally {
    for (const { ref } of targets) ref.unref();
  }
};
