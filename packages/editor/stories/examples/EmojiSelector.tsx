import data from '@emoji-mart/data';
import { useStore } from '@nanostores/react';
import clsx from 'clsx';
import { init, SearchIndex } from 'emoji-mart';
import { useEffect, useState } from 'react';
import type { Editor } from 'slate';
import { useSlateStatic } from 'slate-react';
import styles from './EmojiSelector.module.css';
import { $store } from './store';

init({
  data,
  set: 'apple',
  custom: [
    {
      id: 'custom',
      name: 'Custom',
      emojis: [
        {
          id: 'kona',
          name: 'Kona',
          keywords: ['kona'],
          skins: [{ src: '/editor/kona.svg' }],
        },
      ],
    },
  ],
});

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'em-emoji': {
        id: string;
        size: string | number;
        class?: string;
      };
    }
  }
}

type Props = {
  onConfirm: (emoji: string, query: string, editor: Editor) => void;
};

export const EmojiSelector = (props: Props) => {
  const { onConfirm } = props;

  const editor = useSlateStatic();

  const { emojiSearch } = useStore($store);
  const [index, setIndex] = useState(-1);

  const [items, setItems] = useState<
    Array<{
      id: string;
    }>
  >([]);

  useEffect(() => {
    const search = async () => {
      const emojis = await SearchIndex.search(emojiSearch);

      setItems(emojis.slice(0, 10));
      setIndex(0);
    };

    search();
  }, [emojiSearch]);

  useEffect(() => {
    if (!items.length) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setIndex((index) => (index + 1) % items.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setIndex((index) => (index - 1 + items.length) % items.length);
          break;
        case 'Enter':
          event.preventDefault();
          if (items[index]) {
            onConfirm(items[index].id, emojiSearch, editor);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [items, index, emojiSearch, onConfirm, editor]);

  if (!items.length) {
    return null;
  }

  return (
    <div className={styles.root} role="menu" aria-label="Emoji suggestions">
      {items.map((item, idx) => {
        return (
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            className={clsx(styles.item, { [styles.selected]: idx === index })}
            key={item.id}
            onMouseEnter={() => setIndex(idx)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onConfirm(item.id, emojiSearch, editor)}
          >
            <em-emoji class={styles.emoji} id={item.id} size="20px" />
            <span>:{item.id}:</span>
          </button>
        );
      })}
    </div>
  );
};
