import isHotkey from 'is-hotkey';
import React, {
  type ClipboardEvent,
  isValidElement,
  type JSX,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
} from 'react';
import {
  DecoratedRange,
  Descendant,
  Editor,
  NodeEntry,
  Transforms,
} from 'slate';
import {
  Editable,
  type RenderElementProps,
  type RenderLeafProps,
  useReadOnly,
} from 'slate-react';
import { BaseElement } from '../elements/BaseElement';
import type { IPlugin } from '../types';
import { deserialize } from './deserialize';
import styles from './styles.module.css';

const SUPPORTED_HANDLERS = ['onDrop', 'onKeyDown', 'onPaste'];

type Props = {
  readOnly?: boolean;
};

export const createEditable =
  (editor: Editor, plugins: IPlugin[]) =>
  ({ readOnly }: Props) => {
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

      return result || <BaseElement {...props} />;
    };

    const renderLeaf = (props: RenderLeafProps): JSX.Element => {
      let result: ReactNode;
      for (const plugin of plugins) {
        plugin.leafs?.map((element) => {
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
          <>
            {ui.map((p, index) => (
              <React.Fragment key={index}>
                {p.ui!({ readOnly, children, editor })}
              </React.Fragment>
            ))}
            <div className={styles.editor}>{children}</div>
          </>
        );
      },
      [editor, plugins.filter],
    );

    return (
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
    );
  };
