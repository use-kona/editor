import { useStore } from '@nanostores/react';
import cn from 'clsx';
import type { MapStore } from 'nanostores';
import React, {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Editor } from 'slate';
import { useFocused, useSlate, useSlateSelection } from 'slate-react';
import type { CustomElement } from '../../../types';
import { insert, insertText, removeCommand, set, wrap } from './actions';
import styles from './styles.module.css';
import type { Command, CommandsStore } from './types';

type Props = {
  $store: MapStore<CommandsStore>;
  commands: Command[];
  ignoreNodes?: string[];
  renderMenu: (children: ReactNode) => ReactNode;
};

export const Menu = (props: Props) => {
  const { commands, $store, renderMenu, ignoreNodes = [] } = props;
  const store = useStore($store);
  const [style, setStyle] = useState<CSSProperties | undefined>({});
  const [active, setActive] = useState(0);
  const refs = useRef<Record<string, HTMLButtonElement>>({});

  const selection = useSlateSelection();
  const editor = useSlate() as Editor;
  const isFocused = useFocused();
  const ref = useRef<HTMLDivElement>(null);

  const entry = Editor.above<CustomElement>(editor, {
    match: (n) => Editor.isBlock(editor, n as CustomElement),
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: we care only about those deps
  const actions = useMemo(() => {
    return {
      removeCommand: removeCommand(editor, selection, store.filter),
      set: set(editor, selection, store.filter),
      insert: insert(editor, selection, store.filter),
      wrap: wrap(editor, selection, store.filter),
      insertText: insertText(editor),
    };
  }, [commands, store.filter]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we care only about those deps
  useLayoutEffect(() => {
    const { selection } = editor;

    if (!selection || !isFocused) {
      setStyle(undefined);
      return;
    }

    setTimeout(() => {
      const domSelection = window.getSelection();
      const domRange = domSelection?.getRangeAt(0);
      const rect = domRange?.getBoundingClientRect();

      if (store.isOpen) {
        setStyle({
          opacity: 1,
          transform: 'scale(1)',
          top: `${(rect?.top || 0) + window.scrollY + (rect?.height || 0) + 2}px`,
          left: `${(rect?.left || 0) + window.scrollX + (rect?.width || 0) / 2}px`,
        });
      } else {
        setStyle({
          opacity: 0,
          transform: 'scale(0.9)',
        });
      }
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();
          setActive((active) => {
            const newActive = active >= commands.length - 1 ? 0 : active + 1;
            refs.current[newActive]?.scrollIntoView({ block: 'nearest' });

            return newActive;
          });
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          setActive((active) => {
            const newActive = active <= 0 ? commands.length - 1 : active - 1;
            refs.current[newActive]?.scrollIntoView({ block: 'nearest' });

            return newActive;
          });
          break;
        }
        case 'Enter': {
          event.preventDefault();
          commands[active]?.action(actions, editor);
          $store.setKey('isOpen', false);
          break;
        }
        case 'Escape': {
          event.stopPropagation();
          $store.setKey('isOpen', false);
          break;
        }
      }
    };

    if (store.isOpen && commands.length > 0) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selection, active, actions, store.isOpen]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we care only about filter
  useEffect(() => {
    if (active < 0) {
      setActive(0);
      return;
    }

    if (active > commands.length - 1) {
      setActive(commands.length - 1);
    }
  }, [store.filter]);

  useLayoutEffect(() => {
    const element = ref.current;
    if (element) {
      const { height, top } = element.getBoundingClientRect();

      const domSelection = window.getSelection();
      const domRange = domSelection?.getRangeAt(0);
      const rect = domRange?.getBoundingClientRect();

      if (top + height >= window.innerHeight) {
        setStyle((style) => ({
          ...style,
          top: `${top - height - (rect?.height ?? 22)}px`,
        }));
      }
    }
  }, []);

  if (!commands.length) {
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
          {commands.map((command, index) => (
            <button
              type="button"
              ref={(element) => {
                if (element) {
                  refs.current[index] = element;
                }
              }}
              key={index}
              className={cn(styles.button, {
                [styles.active]: index === active,
              })}
              onMouseDown={(event) => {
                event.preventDefault();
                command.action(actions, editor);
                $store.setKey('isOpen', false);
              }}
            >
              <span className={styles.icon}>{command.icon}</span>
              <span>{command.title}</span>
            </button>
          ))}
        </div>
      </>,
    ),
    document.body,
  );
};
