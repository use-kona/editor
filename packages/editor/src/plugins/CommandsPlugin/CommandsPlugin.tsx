import { useStore } from '@nanostores/react';
import { type MapStore, map } from 'nanostores';
import { Editor, Node } from 'slate';
import type { CustomElement } from '../../../types';
import type { IPlugin, UiParams } from '../../types';
import { Menu } from './Menu';
import type { CommandsStore, Options } from './types';

export class CommandsPlugin implements IPlugin {
  options: Options;
  $store: MapStore<CommandsStore>;

  constructor(options: Options) {
    this.options = options;
    this.$store = map<CommandsStore>({
      isOpen: false,
      filter: false,
      openId: 0,
    });
  }

  init(editor) {
    const { onChange, insertText } = editor;

    editor.insertText = (text: string) => {
      if (text === '/') {
        this.$store.setKey('openId', this.$store.get().openId + 1);
        this.$store.setKey('isOpen', true);
        this.$store.setKey('filter', '');
      }

      insertText(text);
    };

    editor.onChange = (...args) => {
      if (this.$store.get().isOpen) {
        const filter = /\/([^/]*)$/g.exec(getCurrentText(editor));
        if (filter?.[0]) {
          this.$store.setKey('filter', filter[1]);
        } else {
          this.$store.setKey('filter', false);
        }
      }

      return onChange(...args);
    };

    return editor;
  }

  ui(_params: UiParams) {
    const { isOpen } = useStore(this.$store);

    if (!isOpen) {
      return null;
    }

    return (
      <Menu
        renderMenu={this.options.renderMenu}
        $store={this.$store}
        rootCommands={this.options.commands}
        ignoreNodes={this.options.ignoreNodes}
      />
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
