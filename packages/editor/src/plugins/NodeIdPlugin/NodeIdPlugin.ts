import { type Editor, Element, Node, type NodeEntry, Text } from 'slate';
import type { CustomElement } from '../../../types';
import type { IPlugin } from '../../types';

type NodeIdBlock = CustomElement & {
  nodeId: string;
};

const assignId = (node: Node, generateId: () => string) => {
  if (Element.isElement(node)) {
    try {
      if ((node as NodeIdBlock).nodeId) {
        return;
      }

      (node as NodeIdBlock).nodeId = generateId();
      node.children.forEach((n) => {
        assignId(n, generateId);
      });
    } catch {}
  }
};

type Options = {
  generateId: () => string;
};

export class NodeIdPlugin implements IPlugin<Editor, NodeIdBlock> {
  constructor(private options: Options) {}

  init(editor: Editor) {
    const { apply, normalizeNode } = editor;

    editor.apply = (operation) => {
      if (operation.type === 'set_node') {
        const node = Node.get(editor, operation.path);

        const oldType = (operation.properties as CustomElement).type;
        const newType = (operation.newProperties as CustomElement).type;

        if (!node || (!Text.isText(node) && oldType !== newType)) {
          (operation.newProperties as NodeIdBlock).nodeId =
            this.options.generateId();
        }
        return apply(operation);
      }

      if (operation.type === 'insert_node') {
        assignId(operation.node, this.options.generateId);
        return apply(operation);
      }

      if (operation.type === 'split_node') {
        const node = Node.get(editor, operation.path);

        if (!node || !Text.isText(node)) {
          (operation.properties as NodeIdBlock).nodeId =
            this.options.generateId();
        }
        return apply(operation);
      }

      return apply(operation);
    };

    editor.normalizeNode = (entry: NodeEntry) => {
      const [node] = entry;

      assignId(node, this.options.generateId);

      normalizeNode(entry);
    };

    return editor;
  }
}
