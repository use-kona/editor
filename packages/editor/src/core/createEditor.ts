import {
  createEditor as createBaseEditor,
  Editor,
  Path,
  Range,
  Text,
  Transforms,
} from "slate";
import { withHistory } from "slate-history";
import { withReact } from "slate-react";
import type { CustomElement } from "../../types";
import type { Block, IPlugin } from "../types";

export const createEditor = (plugins: IPlugin[]) => () => {
  const baseEditor = withHistory(withReact(createBaseEditor()));

  const editorWithPlugins = plugins.reduce<Editor>((editor, plugin) => {
    if (plugin.init) {
      return plugin.init(editor);
    }

    return editor;
  }, baseEditor);

  const {
    isInline,
    isVoid,
    normalizeNode,
    deleteFragment,
    deleteBackward,
    deleteForward,
  } = editorWithPlugins;

  editorWithPlugins.normalizeNode = (entry) => {
    const [node, path] = entry;

    const lastElement =
      editorWithPlugins.children[editorWithPlugins.children.length - 1];
    if (!lastElement || (lastElement as CustomElement).type !== "paragraph") {
      const paragraph = {
        type: "paragraph",
        children: [{ text: "" }],
      };
      Transforms.insertNodes(editorWithPlugins, paragraph, {
        at: [editorWithPlugins.children.length],
      });
    }

    return normalizeNode([node, path]);
  };

  editorWithPlugins.isVoid = (element) => {
    const result = plugins.reduce<boolean | undefined>((result, plugin) => {
      const match = plugin.blocks?.find((el) => element?.type === el.type);
      if (match && "isVoid" in match) {
        return match.isVoid;
      }

      return result;
    }, undefined);

    return result ?? isVoid(element);
  };

  editorWithPlugins.isInline = (element) => {
    const result = plugins.reduce<boolean | undefined>((result, plugin) => {
      const match = plugin.blocks?.find((el) => element?.type === el.type);
      if (match && "isInline" in match) {
        return match.isInline;
      }

      return result;
    }, undefined);

    return result ?? isInline(element);
  };

  editorWithPlugins.deleteForward = async (unit) => {
    const { selection } = editorWithPlugins;

    if (!selection) {
      return;
    }

    if (Range.isCollapsed(selection)) {
      const firstEntry = Editor.above<CustomElement>(editorWithPlugins, {
        at: selection.anchor,
        match: (n) => Editor.isBlock(editorWithPlugins, n as CustomElement),
        mode: "lowest",
      });

      if (!firstEntry) {
        return;
      }

      const [, currentPath] = firstEntry;

      const secondEntry = Editor.above<CustomElement>(editorWithPlugins, {
        at: Editor.after(editorWithPlugins, selection.anchor),
        match: (n) => Editor.isBlock(editorWithPlugins, n as CustomElement),
        mode: "lowest",
      });

      if (!secondEntry) {
        return;
      }

      const [node, path] = secondEntry;

      if (
        node &&
        Editor.isStart(editorWithPlugins, selection.anchor, currentPath)
      ) {
        const matchedBlock = plugins.reduce<Block | null>((block, plugin) => {
          const match = plugin.blocks?.find((b) => b.type === node.type);
          return block || match || null;
        }, null);

        if (matchedBlock) {
          const result = matchedBlock.onBeforeDelete
            ? await matchedBlock?.onBeforeDelete?.([node])
            : true;
          if (result && Editor.isVoid(editorWithPlugins, node)) {
            Transforms.removeNodes(editorWithPlugins, { at: path });
            matchedBlock.onDelete?.([node]);
          }
          return;
        }
      }
    }

    deleteForward(unit);
  };

  editorWithPlugins.deleteBackward = async (unit) => {
    const { selection } = editorWithPlugins;

    if (!selection) {
      return;
    }

    if (Range.isCollapsed(selection)) {
      const currentEntry = Editor.above<CustomElement>(editorWithPlugins, {
        at: selection.anchor,
        match: (n) => Editor.isBlock(editorWithPlugins, n as CustomElement),
        mode: "lowest",
      });
      const previousEntry = Editor.above<CustomElement>(editorWithPlugins, {
        at: Editor.before(editorWithPlugins, selection.anchor),
        match: (n) => Editor.isBlock(editorWithPlugins, n as CustomElement),
        mode: "lowest",
      });

      if (!currentEntry || !previousEntry) {
        return;
      }

      const [_, currentPath] = currentEntry;
      const [node, path] = previousEntry;

      if (
        node &&
        Editor.isStart(editorWithPlugins, selection.anchor, currentPath)
      ) {
        const matchedBlock = plugins.reduce<Block | null>((block, plugin) => {
          const match = plugin.blocks?.find((b) => b.type === node.type);
          return block || match || null;
        }, null);

        if (matchedBlock) {
          const result = matchedBlock.onBeforeDelete
            ? await matchedBlock.onBeforeDelete([node])
            : true;
          if (result && Editor.isVoid(editorWithPlugins, node)) {
            Transforms.removeNodes(editorWithPlugins, { at: path });
            matchedBlock.onDelete?.([node]);
            return;
          }
        }
      }
    }

    deleteBackward(unit);
  };

  editorWithPlugins.deleteFragment = async (options) => {
    const { selection } = editorWithPlugins;

    if (!selection) {
      return;
    }

    const [start, end] = Range.edges(selection);
    const isSingleText = Path.equals(start.path, end.path);

    if (isSingleText) {
      deleteFragment(options);
      return;
    }

    const nodes = Array.from(
      Editor.nodes<CustomElement>(editorWithPlugins, {
        at: selection,
        match: (n) => {
          return (
            !Editor.isEditor(n) &&
            Editor.isBlock(editorWithPlugins, n as CustomElement)
          );
        },
        reverse: true,
        mode: "highest",
        voids: true,
      })
    );

    for (const entry of nodes) {
      const [node, path] = entry;

      if (Text.isText(node)) {
        Transforms.removeNodes(editorWithPlugins, {
          at: path,
        });
      } else {
        const plugin = plugins.find((plugin) =>
          plugin.blocks?.find((b) => b.type === node.type)
        );

        if (plugin) {
          const match = plugin.blocks?.find((b) => b.type === node.type);

          const hasOnBeforeDelete = match?.onBeforeDelete;

          if (hasOnBeforeDelete) {
            const result = await match.onBeforeDelete!([node]);

            if (result) {
              Transforms.removeNodes(editorWithPlugins, {
                at: path,
                match: (n) => (n as CustomElement).type === node.type,
              });
              match?.onDelete?.([node]);
            } else {
              return;
            }
          } else {
            deleteFragment(options);
            return;
          }
        } else {
          Transforms.removeNodes(editorWithPlugins, {
            at: path,
            match: (n) => (n as CustomElement).type === node.type,
          });
        }
      }
    }

    if (nodes.length > 0) {
      return;
    }

    deleteFragment(options);
  };

  return editorWithPlugins;
};
