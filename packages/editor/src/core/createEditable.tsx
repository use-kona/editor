import { useStore } from '@nanostores/react';
import isHotkey from 'is-hotkey';
import { atom } from 'nanostores';
import React, {
  type ClipboardEvent,
  isValidElement,
  type JSX,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useState,
} from 'react';
import {
  type DecoratedRange,
  type Descendant,
  Editor,
  Element,
  type NodeEntry,
  Path,
  Transforms,
} from 'slate';
import {
  Editable,
  ReactEditor,
  type RenderElementProps,
  type RenderLeafProps,
  useReadOnly,
} from 'slate-react';
import type { CustomElement } from '../../types';
import { BaseElement } from '../elements/BaseElement';
import { Block } from '../elements/Block';
import { EditorProvider } from '../provider';
import type { IPlugin } from '../types';
import { deserialize } from './deserialize';
import styles from './styles.module.css';

const SUPPORTED_HANDLERS = ['onDrop', 'onDragOver', 'onKeyDown', 'onPaste'];

type Props = {
  readOnly?: boolean;
};

export const createEditable =
  (editor: Editor, plugins: IPlugin[]) =>
  ({ readOnly }: Props) => {
    const [selectedNodes] = useState(() => atom<CustomElement[]>([]));

    const $selectedNodes = useStore(selectedNodes);

    const renderElement = (props: RenderElementProps): ReactElement => {
      let result: ReactElement | null = null;

      for (const plugin of plugins) {
        for (const element of plugin.blocks || []) {
          if (element.type !== props.element.type) continue;

          const newElement = element.render(props, editor);
          result = newElement || result;
        }
      }

      for (const plugin of plugins) {
        if (plugin.renderBlock) {
          result = plugin.renderBlock({
            ...props,
            children: result || props.children,
          });
        }
      }

      if (Editor.isInline(editor, props.element)) {
        return result || <BaseElement {...props} />;
      }

      return (
        <Block element={props.element} attributes={props.attributes}>
          {result || <BaseElement {...props} />}
        </Block>
      );
    };

    const renderLeaf = (props: RenderLeafProps): JSX.Element => {
      let result: ReactNode;
      for (const plugin of plugins) {
        plugin.leafs?.forEach((element) => {
          const newElement = element.render(
            {
              ...props,
              children: result || props.children,
            },
            editor,
          );
          if (newElement && isValidElement(newElement)) {
            result = newElement;
          }
        });
      }

      return result as JSX.Element;
    };

    const handleHotkey = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault();
      }

      if (event.key === 'Escape') {
        const currentBlock = Editor.above<CustomElement>(editor, {
          at: editor.selection?.focus,
          match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
        });

        if (!currentBlock) {
          return;
        }

        if ($selectedNodes.length === 0) {
          selectedNodes.set([currentBlock[0]]);
        } else {
          selectedNodes.set([]);
          ReactEditor.blur(editor);
        }
      } else if (event.key === 'ArrowDown') {
        const currentBlock = Editor.above(editor, {
          at: editor.selection?.focus,
          match: (n) => Element.isElement(n),
        });

        if (!currentBlock) return;

        const nextBlock = Editor.next(editor, {
          at: currentBlock[1],
          match: (n) => Element.isElement(n),
          voids: true,
        });

        if (nextBlock) {
          if (Editor.isVoid(editor, nextBlock[0])) {
            event.preventDefault();
            selectedNodes.set([nextBlock[0]]);
          } else {
            selectedNodes.set([]);
          }
          if (
            Editor.isVoid(editor, currentBlock[0]) ||
            Editor.isVoid(editor, nextBlock[0])
          ) {
            event.preventDefault();
            Transforms.select(editor, nextBlock[1]);
            Transforms.collapse(editor, { edge: 'start' });
          }
        }
      } else if (event.key === 'ArrowUp') {
        const currentBlock = Editor.above(editor, {
          at: editor.selection?.focus,
          match: (n) => Element.isElement(n),
        });

        if (!currentBlock) return;

        const prevBlock = Editor.previous(editor, {
          at: currentBlock[1],
          match: (n) => Element.isElement(n),
          voids: true,
        });

        if (prevBlock) {
          if (Editor.isVoid(editor, prevBlock[0])) {
            event.preventDefault();
            selectedNodes.set([prevBlock[0]]);
          } else {
            selectedNodes.set([]);
          }
          if (
            Editor.isVoid(editor, currentBlock[0]) ||
            Editor.isVoid(editor, prevBlock[0])
          ) {
            event.preventDefault();
            Transforms.select(editor, prevBlock[1]);
            Transforms.collapse(editor, { edge: 'end' });
          }
        }
      } else if (event.key === 'Backspace') {
        const currentBlock = Editor.above(editor, {
          at: editor.selection?.focus,
          match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
        });

        if (!currentBlock) return;
        if (editor.selection?.focus.offset !== 0) return;

        const prevBlock = Editor.previous(editor, {
          at: currentBlock[1],
          match: (n) => Element.isElement(n),
          voids: true,
        });

        if (prevBlock && Editor.isVoid(editor, prevBlock[0])) {
          event.preventDefault();
          Transforms.removeNodes(editor, {
            at: currentBlock[1],
          });
          Transforms.select(editor, prevBlock[1]);
          selectedNodes.set([prevBlock[0]]);
          Transforms.collapse(editor, { edge: 'start' });
        }
      } else if (event.key === 'Enter') {
        const currentBlock = Editor.above(editor, {
          at: editor.selection?.focus,
          match: (n) => Element.isElement(n),
        });

        if (!currentBlock) return;

        if (Editor.isVoid(editor, currentBlock[0])) {
          event.preventDefault();
          Transforms.insertNodes(
            editor,
            {
              type: 'paragraph',
              children: [{ text: '' }],
            },
            {
              at: Path.next(currentBlock[1]),
            },
          );
          selectedNodes.set([]);
          Transforms.select(editor, Path.next(currentBlock[1]));
          Transforms.collapse(editor, { edge: 'start' });
        }
      }

      for (const plugin of plugins) {
        if (plugin.hotkeys) {
          for (const hotkey of plugin.hotkeys) {
            if (isHotkey(hotkey[0], event) && hotkey[1]) {
              event.preventDefault();
              hotkey[1](event, editor);
            }
          }
        }
      }
    };

    const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
      const html = event.clipboardData?.getData('text/html');
      if (!html) return;

      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const value = deserialize(plugins)(parsed.body);
      event.preventDefault();

      Transforms.insertNodes(editor, value as Descendant);
    };

    const decorate = (entry: NodeEntry) => {
      const decorators: IPlugin[] = plugins.filter(
        (plugin) => !!plugin.decorate,
      );

      return decorators.reduce<DecoratedRange[]>((decorations, plugin) => {
        const pluginDecorators = plugin.decorate?.(entry) || [];
        return decorations.concat(pluginDecorators);
      }, []);
    };

    const handlers = plugins.reduce(
      (handlers, plugin) => {
        SUPPORTED_HANDLERS.forEach((handlerName) => {
          if (plugin.handlers?.[handlerName]) {
            const lastHandler = handlers[handlerName];
            if (lastHandler) {
              handlers[handlerName] = (event) => {
                lastHandler(event, editor);
                plugin.handlers?.[handlerName](event, editor);
              };
            } else {
              handlers[handlerName] = (event) => {
                plugin.handlers?.[handlerName](event, editor);
              };
            }
          }
        });

        return handlers;
      },
      {
        onKeyDown: handleHotkey,
        onPaste: handlePaste,
      },
    );

    const Ui = useCallback(
      ({ children }: { children: ReactNode }) => {
        const ui = plugins.filter((p) => Boolean(p.ui));
        const readOnly = useReadOnly();

        if (!ui.length) {
          return <div className={styles.editor}>{children}</div>;
        }

        return (
          <div
            className={styles.ui}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            {ui.map((p, index) => (
              <React.Fragment key={index}>
                {p.ui?.({ readOnly, children, editor })}
              </React.Fragment>
            ))}
            <div className={styles.editor}>{children}</div>
          </div>
        );
      },
      [editor, plugins.filter],
    );

    return (
      <EditorProvider selectedNodes={selectedNodes}>
        <div className={styles.root}>
          <Ui>
            <Editable
              decorate={decorate}
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              readOnly={readOnly}
              {...handlers}
            />
          </Ui>
        </div>
      </EditorProvider>
    );
  };
