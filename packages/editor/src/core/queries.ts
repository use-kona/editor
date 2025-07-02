import { Editor, NodeEntry, Node, Path } from 'slate';

export const getPrev = (editor: Editor, node: NodeEntry) => {
  try {
    const [, path] = node;
    return Node.get(editor, Path.previous(path));
  } catch (e) {
    return null;
  }
};
