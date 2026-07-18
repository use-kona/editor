import { Editor, Element, type Path } from 'slate';
import type { NodeWithId } from './types';

type NodeWithIdEntry = [NodeWithId, Path];

const cloneSlateNode = (node: NodeWithId): NodeWithId => {
  return structuredClone(node);
};

/**
 * Gets a copy of listed notes by their ids
 * @param editor
 * @param nodeIds
 */
export const getNodesByNodeIds = (
  editor: Editor,
  nodeIds: string[],
): NodeWithId[] => {
  if (!nodeIds.length) {
    return [];
  }

  const ids = new Set(nodeIds);
  const nodes: NodeWithIdEntry[] = [];

  const entries = Editor.nodes(editor, {
    at: [],
    match: (n) => {
      if (!Element.isElement(n)) {
        return false;
      }

      if (!Editor.isBlock(editor, n)) {
        return false;
      }

      const nodeId = (n as NodeWithId).nodeId;
      return typeof nodeId === 'string' && ids.has(nodeId);
    },
    mode: 'highest',
  });

  try {
    for (const entry of entries) {
      nodes.push(entry as NodeWithIdEntry);
    }
  } catch {
    return [];
  }

  return nodes.map(([node]) => cloneSlateNode(node));
};
