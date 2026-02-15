import { useStore } from '@nanostores/react';
import cn from 'clsx';
import type { MapStore } from 'nanostores';
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Editor, Transforms } from 'slate';
import { useFocused, useSlate, useSlateSelection } from 'slate-react';
import type { CustomElement } from '../../../types';
import { insert, insertText, removeCommand, set, wrap } from './actions';
import styles from './styles.module.css';
import type { Command, CommandPathEntry, CommandsStore } from './types';
import { useResolvedCommands } from './useResolvedCommands';

type Props = {
  $store: MapStore<CommandsStore>;
  rootCommands: Command[];
  ignoreNodes?: string[];
  renderMenu: (children: ReactNode) => ReactNode;
};

export const Menu = (props: Props) => {
  const { rootCommands, $store, renderMenu, ignoreNodes = [] } = props;
  const store = useStore($store);
  const [style, setStyle] = useState<CSSProperties | undefined>({});
  const [active, setActive] = useState(0);
  const [path, setPath] = useState<CommandPathEntry[]>([]);
  const refs = useRef<Record<number, HTMLButtonElement | null>>({});

  const selection = useSlateSelection();
  const editor = useSlate() as Editor;
  const isFocused = useFocused();
  const ref = useRef<HTMLDivElement>(null);

  const entry = Editor.above<CustomElement>(editor, {
    match: (n) => Editor.isBlock(editor, n as CustomElement),
  });

  const isBrowseMode = typeof store.filter === 'string' && store.filter === '';

  const { commands, isLoading, isError } = useResolvedCommands({
    rootCommands,
    filter: store.filter,
    path,
    editor,
    isOpen: store.isOpen,
  });
  const entries = useMemo(() => {
    const commandEntries = commands.map((command) => ({
      type: 'command' as const,
      command,
    }));

    if (isBrowseMode && path.length > 0) {
      return [{ type: 'back' as const }, ...commandEntries];
    }

    return commandEntries;
  }, [commands, isBrowseMode, path.length]);

  const enterSubmenu = useCallback(
    (nextPath: CommandPathEntry[]) => {
      if (!isBrowseMode && typeof store.filter === 'string' && store.filter) {
        const focus = selection?.focus ?? editor.selection?.focus;

        if (focus) {
          Transforms.delete(editor, {
            at: focus,
            distance: store.filter.length,
            reverse: true,
            unit: 'character',
          });
        }

        $store.setKey('filter', '');
      }

      setPath(nextPath);
      setActive(0);
    },
    [editor, isBrowseMode, selection, store.filter, $store],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: we care only about those deps
  const actions = useMemo(() => {
    return {
      removeCommand: removeCommand(editor, selection, store.filter),
      set: set(editor, selection, store.filter),
      insert: insert(editor, selection, store.filter),
      wrap: wrap(editor, selection, store.filter),
      insertText: insertText(editor),
    };
  }, [selection, store.filter]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on open session changes
  useEffect(() => {
    if (!store.isOpen) {
      return;
    }
    setPath([]);
    setActive(0);
  }, [store.isOpen, store.openId]);

  useEffect(() => {
    if (
      store.filter === false ||
      (typeof store.filter === 'string' && store.filter !== '')
    ) {
      setActive(0);
    }
  }, [store.filter]);

  useEffect(() => {
    if (!entries.length) {
      setActive(0);
      return;
    }

    if (active > entries.length - 1) {
      setActive(entries.length - 1);
    }
  }, [active, entries]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we care only about those deps
  useLayoutEffect(() => {
    const { selection } = editor;

    if (!selection || !isFocused) {
      setStyle(undefined);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const domSelection = window.getSelection();
      const domRange =
        domSelection && domSelection.rangeCount > 0
          ? domSelection.getRangeAt(0)
          : null;
      const rect = domRange?.getBoundingClientRect();
      const x = (rect?.left || 0) + (rect?.width || 0) / 2;
      const menuHeight = ref.current?.offsetHeight || 0;
      let y = (rect?.top || 0) + (rect?.height || 0) + 2;

      if (menuHeight > 0 && y + menuHeight >= window.innerHeight) {
        y = Math.max(8, (rect?.top || 0) - menuHeight - 2);
      }

      const transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) ${store.isOpen ? 'scale(1)' : 'scale(0.95)'}`;

      setStyle({
        opacity: store.isOpen ? 1 : 0,
        transform,
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [selection, commands.length, isLoading, isError, store.isOpen, isFocused]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!store.isOpen) {
        return;
      }

      switch (event.key) {
        case 'ArrowDown': {
          if (!entries.length) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          setActive((active) => {
            const nextActive = active >= entries.length - 1 ? 0 : active + 1;
            refs.current[nextActive]?.scrollIntoView({ block: 'nearest' });
            return nextActive;
          });
          break;
        }
        case 'ArrowUp': {
          if (!entries.length) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          setActive((active) => {
            const nextActive = active <= 0 ? entries.length - 1 : active - 1;
            refs.current[nextActive]?.scrollIntoView({ block: 'nearest' });
            return nextActive;
          });
          break;
        }
        case 'ArrowRight': {
          const entry = entries[active];
          if (!entry || entry.type !== 'command' || !entry.command.isSubmenu) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          enterSubmenu(entry.command.path);
          break;
        }
        case 'ArrowLeft': {
          if (!isBrowseMode || !path.length) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          setPath((path) => path.slice(0, path.length - 1));
          setActive(0);
          break;
        }
        case 'Enter': {
          const entry = entries[active];
          if (!entry) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          if (entry.type === 'back' && isBrowseMode) {
            setPath((path) => path.slice(0, path.length - 1));
            setActive(0);
            break;
          }

          if (entry.type !== 'command') {
            break;
          }

          if (entry.command.isSubmenu) {
            enterSubmenu(entry.command.path);
            break;
          }

          entry.command.command.action?.(actions, editor);
          $store.setKey('isOpen', false);
          break;
        }
        case 'Escape': {
          event.preventDefault();
          event.stopPropagation();
          $store.setKey('isOpen', false);
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    actions,
    active,
    entries,
    editor,
    enterSubmenu,
    isBrowseMode,
    path.length,
    store.isOpen,
    $store,
  ]);

  const hasRows = entries.length > 0 || isError;

  if (store.filter === false || !hasRows) {
    return null;
  }

  if (entry && ignoreNodes.includes(entry[0].type)) {
    return null;
  }

  return createPortal(
    renderMenu(
      <>
        {store.isOpen && (
          <div
            className={styles.backdrop}
            onClick={() => {
              $store.setKey('isOpen', false);
            }}
          />
        )}
        <div
          ref={ref}
          style={style}
          className={styles.menu}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
        >
          {entries.map((entry, index) => {
            if (entry.type === 'back') {
              return (
                <button
                  type="button"
                  ref={(element) => {
                    refs.current[index] = element;
                  }}
                  key="back"
                  className={cn(styles.button, {
                    [styles.active]: index === active,
                  })}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setPath((path) => path.slice(0, path.length - 1));
                    setActive(0);
                  }}
                >
                  <span className={styles.icon}>...</span>
                  <span className={styles.content}>
                    <span>...</span>
                  </span>
                </button>
              );
            }

            return (
              <button
                type="button"
                ref={(element) => {
                  refs.current[index] = element;
                }}
                key={entry.command.key}
                className={cn(styles.button, {
                  [styles.active]: index === active,
                })}
                onMouseDown={(event) => {
                  event.preventDefault();
                  if (entry.command.isSubmenu) {
                    enterSubmenu(entry.command.path);
                    return;
                  }

                  entry.command.command.action?.(actions, editor);
                  $store.setKey('isOpen', false);
                }}
              >
                {entry.command.command.render?.({
                  command: entry.command.command,
                  isSubmenu: entry.command.isSubmenu,
                  isActive: index === active,
                }) ?? (
                  <>
                    <span className={styles.icon}>
                      {entry.command.command.icon}
                    </span>
                    <span className={styles.content}>
                      <span>{entry.command.command.title}</span>
                    </span>
                    {entry.command.isSubmenu && (
                      <span className={styles.submenu} aria-hidden="true">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <path d="M9 6l6 6l-6 6" />
                        </svg>
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
          {isError && (
            <div className={styles.systemRow}>Could not load commands</div>
          )}
        </div>
      </>,
    ),
    document.body,
  );
};
