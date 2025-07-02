import { useStore } from '@nanostores/react';
import { computed, type MapStore, map, type ReadableAtom } from 'nanostores';
import { Editor, Node } from 'slate';
import type { CustomElement } from '../../../types';
import type { IPlugin, UiParams } from '../../types';
import { Menu } from './Menu';
import type { CommandsStore, Options } from './types';

export class CommandsPlugin implements IPlugin {
  options: Options;
  $store: MapStore<CommandsStore>;
  $commands: ReadableAtom<CommandsStore['commands']>;

  constructor(options: Options) {
    this.options = options;
    this.$store = map<CommandsStore>({
      isOpen: false,
      filter: false,
      commands: [],
    });

    this.$commands = computed(this.$store, (store) => {
      if (store.filter === false) {
        return [];
      }

      return store.commands.filter((command) => {
        const isCommandMatches = command.commandName
          .toLocaleLowerCase()
          .includes((store.filter as string).toLocaleLowerCase());

        const isTitleMatches = command.title
          .toLocaleLowerCase()
          .includes((store.filter as string).toLocaleLowerCase());

        return isCommandMatches || isTitleMatches;
      });
    });
  }

  init(editor) {
    const { onChange, insertText } = editor;

    editor.insertText = (text: string) => {
      if (text === '/') {
        this.$store.setKey('isOpen', true);
        this.$store.setKey('commands', this.options.commands);
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

  ui(params: UiParams) {
    const commands = useStore(this.$commands);
    const { isOpen } = useStore(this.$store);

    if (!isOpen) {
      return null;
    }

    return (
      <Menu
        renderMenu={this.options.renderMenu}
        $store={this.$store}
        commands={commands}
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
