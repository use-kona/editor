import { useStore } from '@nanostores/react';
import type { MapStore } from 'nanostores';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import type { Editor } from 'slate';
import {
  BasicFormattingPlugin,
  HighlightsPlugin,
  LinksPlugin,
} from '../plugins';
import { Color, colors } from './colors';
import styles from './FloatingMenu.module.css';
import { BoldIcon } from './icons/bold';
import { CheckIcon } from './icons/check';
import { ColorIcon } from './icons/color';
import { CrossIcon } from './icons/cross';
import { ItalicIcon } from './icons/italic';
import { LinkIcon } from './icons/link';
import { StrikethroughIcon } from './icons/strikethrough';
import { UnderlineIcon } from './icons/underline';

type Mode = 'main' | 'link' | 'colors';

type Props = {
  $store: MapStore<
    {
      isFloatingMenuOpen: boolean;
      floatingMenuMode: Mode;
      url?: string;
    } & {
      [key: string]: unknown;
    }
  >;
  editor: Editor;
  commands: {
    onClose: () => void;
    onUpdate: () => void;
  };
};

const getButtonClassName = (isActive: boolean) => {
  return isActive ? [styles.button, styles.active].join(' ') : styles.button;
};

export const FloatingMenu = (props: Props) => {
  const { editor, $store, commands } = props;
  const {
    isFloatingMenuOpen,
    floatingMenuMode: mode,
    url: defaultUrl,
  } = useStore($store);

  const [url, setUrl] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: here we care only about this option
  useEffect(() => {
    if (!isFloatingMenuOpen) {
      $store.setKey('floatingMenuMode', 'main');
    }
  }, [isFloatingMenuOpen]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: here we care only about this option
  useEffect(() => {
    commands.onUpdate();
  }, [mode]);

  useEffect(() => {
    setUrl(defaultUrl || '');
  }, [defaultUrl]);

  useEffect(() => {
    if (mode === 'link') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [mode]);

  const handleLinkSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.querySelector('input');
    const text = input?.value || '';

    LinksPlugin.addLink(editor, text);
    $store.setKey('floatingMenuMode', 'main');
    commands.onClose();
    setUrl('');
  };

  const handleLinkRemove = () => {
    LinksPlugin.removeLink(editor);
    $store.setKey('floatingMenuMode', 'main');
    commands.onClose();
    setUrl('');
  };

  const renderMainMenu = () => {
    return (
      <>
        <button
          type="button"
          className={getButtonClassName(
            BasicFormattingPlugin.isMarkActive(editor, 'bold'),
          )}
          onMouseDown={(event) => {
            event.preventDefault();
            BasicFormattingPlugin.toggleBold(editor);
          }}
        >
          <BoldIcon size={16} />
        </button>
        <button
          type="button"
          className={getButtonClassName(
            BasicFormattingPlugin.isMarkActive(editor, 'italic'),
          )}
          onMouseDown={(event) => {
            event.preventDefault();
            BasicFormattingPlugin.toggleItalic(editor);
          }}
        >
          <ItalicIcon size={16} />
        </button>
        <button
          type="button"
          className={getButtonClassName(
            BasicFormattingPlugin.isMarkActive(editor, 'underline'),
          )}
          onMouseDown={(event) => {
            event.preventDefault();
            BasicFormattingPlugin.toggleUnderline(editor);
          }}
        >
          <UnderlineIcon size={16} />
        </button>
        <button
          type="button"
          className={getButtonClassName(
            BasicFormattingPlugin.isMarkActive(editor, 'strikethrough'),
          )}
          onMouseDown={(event) => {
            event.preventDefault();
            BasicFormattingPlugin.toggleStrikethrough(editor);
          }}
        >
          <StrikethroughIcon size={16} />
        </button>
        <button
          type="button"
          className={styles.button}
          onMouseDown={(event) => {
            event.preventDefault();
            $store.setKey('floatingMenuMode', 'link');
          }}
        >
          <LinkIcon size={16} />
        </button>
        <button
          type="button"
          className={styles.button}
          onMouseDown={(event) => {
            event.preventDefault();
            $store.setKey('floatingMenuMode', 'colors');
          }}
        >
          <ColorIcon size={16} />
        </button>
      </>
    );
  };

  const renderColorsMenu = () => {
    return (
      <>
        <button
          type="button"
          className={getButtonClassName(
            HighlightsPlugin.isHighlightActive(editor, Color.Red),
          )}
          onMouseDown={(event) => {
            event.preventDefault();
            HighlightsPlugin.toggleHighlight(editor, Color.Red);
            $store.setKey('floatingMenuMode', 'main');
          }}
        >
          <span
            className={styles.color}
            style={{ backgroundColor: colors[Color.Red] }}
          />
        </button>
        <button
          type="button"
          className={getButtonClassName(
            HighlightsPlugin.isHighlightActive(editor, Color.Blue),
          )}
          onMouseDown={(event) => {
            event.preventDefault();
            HighlightsPlugin.toggleHighlight(editor, Color.Blue);
            $store.setKey('floatingMenuMode', 'main');
          }}
        >
          <span
            className={styles.color}
            style={{ backgroundColor: colors[Color.Blue] }}
          />
        </button>
        <button
          type="button"
          className={getButtonClassName(
            HighlightsPlugin.isHighlightActive(editor, Color.Yellow),
          )}
          onMouseDown={(event) => {
            event.preventDefault();
            HighlightsPlugin.toggleHighlight(editor, Color.Yellow);
            $store.setKey('floatingMenuMode', 'main');
          }}
        >
          <span
            className={styles.color}
            style={{ backgroundColor: colors[Color.Yellow] }}
          />
        </button>
        <button
          type="button"
          className={styles.button}
          onMouseDown={(event) => {
            event.preventDefault();
            HighlightsPlugin.removeHighlight(editor);
            $store.setKey('floatingMenuMode', 'main');
          }}
        >
          <CrossIcon size={16} />
        </button>
      </>
    );
  };

  const renderLinkMenu = () => {
    return (
      <form onSubmit={handleLinkSubmit} className={styles.link}>
        <input
          ref={inputRef}
          value={url}
          onClick={(event) => (event.target as HTMLInputElement).focus()}
          onChange={(event) => setUrl(event.target.value)}
          type="text"
          placeholder="Enter link"
        />
        {!defaultUrl ? (
          <>
            <button type="submit">
              <CheckIcon size={16} />
            </button>
            <button type="button" onClick={handleLinkRemove}>
              <CrossIcon size={16} />
            </button>
          </>
        ) : (
          <>
            <button type="submit">
              <CheckIcon size={16} />
            </button>
            <button type="button" onClick={handleLinkRemove}>
              <CrossIcon size={16} />
            </button>
          </>
        )}
      </form>
    );
  };

  const renderMenu = () => {
    switch (mode) {
      case 'main':
        return renderMainMenu();
      case 'colors':
        return renderColorsMenu();
      case 'link':
        return renderLinkMenu();
    }
  };

  return (
    <>
      <div className={styles.root}>{renderMenu()}</div>
    </>
  );
};
