import { useStore } from '@nanostores/react';
import { type MapStore, map } from 'nanostores';
import type { ReactNode } from 'react';
import { Editor, Node, Transforms } from 'slate';
import type { CustomElement } from '../../../types';
import type { IPlugin } from '../../types';
import { Menu } from './Menu';
import styles from './styles.module.css';
import type { EmojiElement } from './types';

type Options = {
  onSearch: (query: string) => void;
  renderMenu: (actions: {
    insertEmoji: (emoji: string, query: string, editor: Editor) => void;
  }) => ReactNode;
  renderEmoji: (emoji: string) => ReactNode;
  ignoreNodes?: string[];
  portalTarget?: Element | null;
};

export class EmojiPlugin implements IPlugin {
  options: Options;
  $store: MapStore<{ isOpen: boolean }>;

  constructor(options: Options) {
    this.options = options;
    this.$store = map({
      isOpen: false,
    });
  }

  blocks = [
    {
      isInline: true,
      isVoid: true,
      type: 'emoji',
      render: (props) => {
        const children = this.options.renderEmoji(props.element.emoji);

        return (
          <span {...props.attributes} className={styles.emojiRoot}>
            {children}
          </span>
        );
      },
    },
  ];

  init(editor) {
    const { insertText, onChange } = editor;

    editor.insertText = (text: string) => {
      if (text === ':') {
        this.$store.setKey('isOpen', true);
      }

      insertText(text);
    };

    editor.onChange = (...args) => {
      if (this.$store.get().isOpen) {
        const query = /:([^:]*$)/.exec(getCurrentText(editor));
        if (query?.[0]) {
          this.options.onSearch(query[1]);
        } else {
          this.$store.setKey('isOpen', false);
        }
      }

      return onChange(...args);
    };

    return editor;
  }

  ui() {
    const { isOpen } = useStore(this.$store);

    if (!isOpen) {
      return null;
    }

    return (
      <Menu isOpen={isOpen} portalTarget={this.options.portalTarget}>
        {this.options.renderMenu({
          insertEmoji: (emoji, query, editor) => {
            this.$store.setKey('isOpen', false);
            Transforms.delete(editor, {
              at: editor.selection?.focus,
              distance: query.length + 1,
              reverse: true,
              unit: 'character',
            });
            Transforms.insertNodes(editor, {
              type: 'emoji',
              emoji,
              children: [{ text: '' }],
            } as EmojiElement);
            Transforms.move(editor);
          },
        })}
      </Menu>
    );
  }
}

const getCurrentText = (editor: Editor) => {
  const entry = Editor.above(editor, {
    match: (n) => Editor.isBlock(editor, n as CustomElement),
  });

  if (entry) {
    return Node.string(entry[0]);
  } else {
    return '';
  }
};
