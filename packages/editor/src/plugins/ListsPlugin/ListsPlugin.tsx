import type { KeyboardEvent } from 'react';
import {
  type Ancestor,
  Editor,
  Element,
  Node,
  type NodeEntry,
  type Path,
  Transforms,
} from 'slate';
import type { RenderElementProps } from 'slate-react';
import type { CustomElement } from '../../../types';
import { getPrev } from '../../core/queries';
import type { IPlugin } from '../../types';
import styles from './styles.module.css';

type Options = {
  listTypes?: string[];
  listItemTypes?: string[];
};

export class ListsPlugin implements IPlugin {
  options: Options;

  static BULLETED_LIST_ELEMENT = 'ul';
  static NUMBERED_LIST_ELEMENT = 'ol';
  static LIST_ITEM_ELEMENT = 'li';

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

      if (this.isList(editor, node as CustomElement)) {
        /* Unwrap lists around non-list-items */
        for (const [child, childPath] of Array.from(
          Node.children(editor, path),
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
              mode: 'all',
              split: true,
            },
          );
        }
      }

      normalizeNode(entry);
    };

    editor.insertBreak = () => {
      const ancestor = Editor.above<CustomElement>(editor, {
        match: (n) => Editor.isBlock(editor, n as CustomElement),
        mode: 'lowest',
      });

      if (!ancestor) {
        return insertBreak();
      }

      const [element] = ancestor;

      if (this.isListItem(editor, element)) {
        if (Editor.isEmpty(editor, element)) {
          Transforms.setNodes(editor, {
            type: 'paragraph',
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
    },
  ];

  handlers = {
    onKeyDown: (event: KeyboardEvent, editor: Editor) => {
      const { selection } = editor;
      const [match] = Array.from(
        Editor.nodes(editor, {
          match: (n) => this.isListItem(editor, n as CustomElement),
        }),
      );

      if (event.key === 'Backspace') {
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
            type: 'paragraph',
          });
        }
      }

      if (event.key === 'Tab') {
        if (match) {
          const [newMatch] = Array.from(
            Editor.nodes(editor, {
              mode: 'lowest',
              match: (n) => this.isList(editor, n as CustomElement),
            }),
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

            const prevListItem = getPrev(editor, currentListItem);

            if (!prevListItem) {
              return;
            }

            if (currentListItem && prevListItem) {
              const currentDepth = this.getListItemDepth(
                editor,
                currentListItem[1],
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
                  },
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
      }),
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
        this.options.listTypes?.includes(node.type),
    );
  };

  private isListItem = (editor: Editor, node: CustomElement) => {
    return Boolean(
      Editor.isBlock(editor, node) &&
        this.options.listItemTypes?.includes(node.type),
    );
  };

  static toggleList = (
    editor: Editor,
    listType: string,
    listItemType = ListsPlugin.LIST_ITEM_ELEMENT,
  ) => {
    Editor.withoutNormalizing(editor, () => {
      const node = Editor.above(editor, {
        match: (n) =>
          [
            ListsPlugin.BULLETED_LIST_ELEMENT,
            ListsPlugin.NUMBERED_LIST_ELEMENT,
          ].includes((n as CustomElement).type),
      });

      if (node) {
        Transforms.setNodes(
          editor,
          {
            type: listType,
          },
          {
            match: (n) =>
              [
                ListsPlugin.BULLETED_LIST_ELEMENT,
                ListsPlugin.NUMBERED_LIST_ELEMENT,
              ].includes((n as CustomElement).type),
          },
        );
      } else {
        Transforms.setNodes(editor, { type: listItemType }, { mode: 'lowest' });
        Transforms.wrapNodes(
          editor,
          { type: listType, children: [] },
          { match: (n) => (n as CustomElement).type === listItemType },
        );
      }
    });
  };

  private getListItemDepth = (editor: Editor, path?: Path) => {
    const item = this.getListItem(editor, path);

    if (item) {
      let count = 0;
      let parent = Editor.parent(editor, item[1]);
      while (
        parent !== null &&
        this.isList(editor, parent[0] as CustomElement)
      ) {
        parent = Editor.parent(editor, parent[1]);
        count++;
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
      mode: 'lowest',
      at: path,
      match: (n) => this.isListItem(editor, n as CustomElement),
    });
  };
}
