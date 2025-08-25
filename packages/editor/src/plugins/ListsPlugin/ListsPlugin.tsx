import type { KeyboardEvent } from "react";
import {
  type Ancestor,
  Editor,
  Element,
  Node,
  type NodeEntry,
  Path,
  Transforms,
} from "slate";
import { jsx } from "slate-hyperscript";
import type { RenderElementProps } from "slate-react";
import type { CustomElement } from "../../../types";
import type { IPlugin } from "../../types";
import styles from "./styles.module.css";

type Options = {
  listTypes?: string[];
  listItemTypes?: string[];
};

export class ListsPlugin implements IPlugin {
  options: Options;

  static BULLETED_LIST_ELEMENT = "ul";
  static NUMBERED_LIST_ELEMENT = "ol";
  static LIST_ITEM_ELEMENT = "li";

  constructor(options: Options = {}) {
    const { listTypes = [], listItemTypes = [] } = options;

    this.options = {
      listTypes: [
        ListsPlugin.BULLETED_LIST_ELEMENT,
        ListsPlugin.NUMBERED_LIST_ELEMENT,
        ...listTypes,
      ],
      listItemTypes: [ListsPlugin.LIST_ITEM_ELEMENT, ...listItemTypes],
    };
  }

  init = (editor: Editor) => {
    const { normalizeNode, insertBreak } = editor;

    editor.normalizeNode = (entry: NodeEntry) => {
      const [node, path] = entry;
      //
      if (this.isList(editor, node as CustomElement)) {
        /* Unwrap lists around non-list-items */
        for (const [child, childPath] of Array.from(
          Node.children(editor, path)
        )) {
          if (
            !this.isListItem(editor, child as CustomElement) &&
            !this.isList(editor, child as CustomElement)
          ) {
            Transforms.unwrapNodes(editor, {
              at: childPath,
              match: (n) => this.isList(editor, n as CustomElement),
              split: true,
            });
            return;
          }
        }
      }

      if (this.isListItem(editor, node as CustomElement)) {
        const parent = Editor.above(editor, {
          at: path,
          match: (n) => this.isList(editor, n as CustomElement),
        });

        if (!parent) {
          return Transforms.wrapNodes(
            editor,
            {
              type: ListsPlugin.BULLETED_LIST_ELEMENT,
              children: [],
            },
            {
              at: path,
              match: (n) => this.isListItem(editor, n as CustomElement),
              mode: "all",
              split: true,
            }
          );
        }
      }

      if (this.isList(editor, node as CustomElement)) {
        if (!Path.hasPrevious(path)) {
          normalizeNode(entry);
          return;
        }

        const prevListItemPath = Editor.before(editor, path, {
          unit: "block",
        });

        const prevList =
          prevListItemPath &&
          Editor.above<CustomElement>(editor, {
            at: prevListItemPath,
            match: (n) => this.isList(editor, n as CustomElement),
          });

        if (prevList) {
          const currentDepth = this.getListDepth(editor, path);
          const prevDepth = this.getListDepth(editor, prevList[1]);

          if (
            this.isList(editor, prevList[0] as CustomElement) &&
            currentDepth === prevDepth &&
            prevList[0].type === (node as CustomElement).type
          ) {
            try {
              Transforms.mergeNodes(editor, {
                at: path,
                match: (n) => this.isList(editor, n as CustomElement),
              });
            } catch (e) {}
          }
        }
      }

      normalizeNode(entry);
    };

    editor.insertBreak = () => {
      const ancestor = Editor.above<CustomElement>(editor, {
        match: (n) => Editor.isBlock(editor, n as CustomElement),
        mode: "lowest",
      });

      if (!ancestor) {
        return insertBreak();
      }

      const [element] = ancestor;

      if (this.isListItem(editor, element)) {
        if (Editor.isEmpty(editor, element)) {
          Transforms.setNodes(editor, {
            type: "paragraph",
          });

          Transforms.unwrapNodes(editor, {
            match: (n) => this.isList(editor, n as CustomElement),
            split: true,
          });
        } else {
          insertBreak();
        }
      } else {
        insertBreak();
      }
    };

    return editor;
  };

  blocks = [
    {
      type: ListsPlugin.BULLETED_LIST_ELEMENT,
      render: (props: RenderElementProps) => {
        return (
          <ul className={styles.list} {...props.attributes}>
            {props.children}
          </ul>
        );
      },
      serialize: (element, children) => {
        if (element.type === ListsPlugin.BULLETED_LIST_ELEMENT) {
          return `<ul>${children}</ul>`;
        }
      },
      deserialize: (element: HTMLElement, children) => {
        const { nodeName } = element;
        if (nodeName === "UL") {
          return jsx(
            "element",
            { type: ListsPlugin.BULLETED_LIST_ELEMENT },
            children
          );
        }
      },
    },
    {
      type: ListsPlugin.NUMBERED_LIST_ELEMENT,
      render: (props: RenderElementProps) => {
        return (
          <ol className={styles.list} {...props.attributes}>
            {props.children}
          </ol>
        );
      },
      serialize: (element, children) => {
        if (element.type === ListsPlugin.NUMBERED_LIST_ELEMENT) {
          return `<ol>${children}</ol>`;
        }
      },
      deserialize: (element: HTMLElement, children) => {
        const { nodeName } = element;
        if (nodeName === "OL") {
          return jsx(
            "element",
            { type: ListsPlugin.NUMBERED_LIST_ELEMENT },
            children
          );
        }
      },
    },
    {
      type: ListsPlugin.LIST_ITEM_ELEMENT,
      render: (props: RenderElementProps) => {
        return (
          <li className={styles.listItem} {...props.attributes}>
            {props.children}
          </li>
        );
      },
      serialize: (element, children) => {
        if (element.type === ListsPlugin.LIST_ITEM_ELEMENT) {
          return `<li>${children}</li>`;
        }
      },
      deserialize: (element: HTMLElement, children) => {
        const { nodeName } = element;
        if (nodeName === "LI") {
          return jsx(
            "element",
            { type: ListsPlugin.LIST_ITEM_ELEMENT },
            children
          );
        }
      },
    },
  ];

  handlers = {
    onKeyDown: (event: KeyboardEvent, editor: Editor) => {
      const { selection } = editor;
      const [match] = Array.from(
        Editor.nodes(editor, {
          match: (n) => this.isListItem(editor, n as CustomElement),
        })
      );

      if (event.key === "Backspace") {
        if (
          selection &&
          match &&
          this.getListItemDepth(editor, match[1]) === 1 &&
          Editor.isStart(editor, selection.anchor, match[1])
        ) {
          Transforms.unwrapNodes(editor, {
            match: (n) => this.isList(editor, n as CustomElement),
            split: true,
          });

          Transforms.setNodes(editor, {
            type: "paragraph",
          });
        }
      }

      if (event.key === "Tab") {
        if (match) {
          const [newMatch] = Array.from(
            Editor.nodes(editor, {
              mode: "lowest",
              match: (n) => this.isList(editor, n as CustomElement),
            })
          );

          if (event.shiftKey && newMatch[1].length > 1) {
            Transforms.liftNodes(editor, {
              match: (n) => this.isListItem(editor, n as CustomElement),
            });
          } else if (!event.shiftKey) {
            const currentListItem = this.getListItem(editor);

            if (!currentListItem) {
              return;
            }

            const prevListItemPath = Editor.before(editor, currentListItem[1], {
              unit: "block",
            });

            if (currentListItem && prevListItemPath) {
              const prevListItem = Editor.above(editor, {
                at: prevListItemPath,
                match: (n) => {
                  return this.isListItem(editor, n as CustomElement);
                },
              });

              if (!prevListItem) {
                return;
              }

              const currentDepth = this.getListItemDepth(
                editor,
                currentListItem[1]
              );

              const prevDepth = this.getListItemDepth(editor, prevListItem[1]);

              if (prevListItem && prevDepth >= currentDepth) {
                Transforms.wrapNodes(
                  editor,
                  {
                    type: (newMatch[0] as CustomElement).type,
                    children: [],
                  },
                  {
                    match: (n) => this.isListItem(editor, n as CustomElement),
                  }
                );
              }
            }
          }

          event.preventDefault();
        }

        return true;
      }
    },
  };

  static isListActive = (editor: Editor, type: string) => {
    const { selection } = editor;

    if (!selection) return false;

    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: (node) =>
          !Editor.isEditor(node) &&
          Element.isElement(node) &&
          node.type === type,
      })
    );

    return !!match;
  };

  static isBulletedListActive = (editor: Editor) => {
    return ListsPlugin.isListActive(editor, ListsPlugin.BULLETED_LIST_ELEMENT);
  };

  static isNumberedListActive = (editor: Editor) => {
    return ListsPlugin.isListActive(editor, ListsPlugin.NUMBERED_LIST_ELEMENT);
  };

  private isList = (editor: Editor, node: CustomElement) => {
    return Boolean(
      Editor.isBlock(editor, node) &&
        this.options.listTypes?.includes(node.type)
    );
  };

  private isListItem = (editor: Editor, node: CustomElement) => {
    return Boolean(
      Editor.isBlock(editor, node) &&
        this.options.listItemTypes?.includes(node.type)
    );
  };

  toggleList = (
    editor: Editor,
    listType: string,
    listItemType = ListsPlugin.LIST_ITEM_ELEMENT,
    defaultType = "paragraph"
  ) => {
    Editor.withoutNormalizing(editor, () => {
      const listEntry = Editor.above(editor, {
        match: (n) => {
          return this.isList(editor, n as CustomElement);
        },
        mode: "lowest",
      });

      const { selection } = editor;

      if (listEntry) {
        if (!selection) return;

        const [node, path] = listEntry;
        const currentListType = (node as CustomElement).type;

        const range = Editor.unhangRange(editor, selection);

        if (currentListType === listType) {
          Transforms.setNodes(
            editor,
            { type: defaultType },
            {
              at: range,
              match: (n) => {
                return Element.isElement(n) && n.type === listItemType;
              },
              mode: "highest",
            }
          );
        } else {
          Transforms.setNodes(
            editor,
            { type: listType, children: [] },
            {
              at: path,
              match: (n) => node === n,
            }
          );
        }
      } else {
        if (!selection) {
          return;
        }

        const range = Editor.unhangRange(editor, selection);

        Transforms.setNodes(
          editor,
          { type: listItemType },
          {
            at: range,
            match: (n) => {
              return Element.isElement(n) && Editor.isBlock(editor, n);
            },
          }
        );

        Transforms.wrapNodes(
          editor,
          { type: listType, children: [] },
          {
            at: range,
            match: (n) => {
              return Element.isElement(n as CustomElement);
            },
            mode: "highest",
          }
        );
      }
    });
  };

  private getListItemDepth = (editor: Editor, path?: Path) => {
    const item = this.getListItem(editor, path);

    if (item) {
      let count = 0;
      let parent = Editor.parent(editor, item[1]);
      do {
        parent = Editor.parent(editor, parent[1]);
        count++;
      } while (
        parent !== null &&
        this.isList(editor, parent[0] as CustomElement)
      );

      return count;
    }

    return 0;
  };

  private getListDepth = (editor: Editor, path?: Path) => {
    if (path) {
      const node = Node.get(editor, path) as CustomElement;
      if (!this.isList(editor, node)) {
        return 0;
      }

      let count = 0;
      let parent = Editor.parent(editor, path);

      while (parent && this.isList(editor, parent[0] as CustomElement)) {
        count++;
        parent = Editor.parent(editor, parent[1]);
      }

      return count;
    }
    return 0;
  };

  private getListItem = (editor: Editor, path?: Path) => {
    if (path) {
      const node = Node.get(editor, path) as CustomElement;
      if (node && this.isListItem(editor, node)) {
        return [node, path] as NodeEntry<Ancestor>;
      }
    }

    return Editor.above(editor, {
      mode: "lowest",
      at: path,
      match: (n) => this.isListItem(editor, n as CustomElement),
    });
  };
}
