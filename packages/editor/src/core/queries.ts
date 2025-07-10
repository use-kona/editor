import { Editor, type NodeEntry, Path } from 'slate';

/**
 * @deprecated
 */
export const getPrev = (editor: Editor, node: NodeEntry) => {
  try {
    const [, path] = node;
    return Editor.above(editor, {
      at: Path.previous(path),
      mode: 'lowest',
    });
  } catch (e) {
    return null;
  }
};
