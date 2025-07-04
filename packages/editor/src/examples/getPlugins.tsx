import type { Editor } from 'slate';
import {
  BasicFormattingPlugin,
  BreaksPlugin,
  CodeBlockPlugin,
  type Commands,
  CommandsPlugin,
  DnDPlugin,
  FloatingMenuPlugin,
  HeadingsPlugin,
  HighlightsPlugin,
  LinksPlugin,
  ListsPlugin,
  MenuPlugin,
  NodeIdPlugin,
  PlaceholderPlugin,
  ShortcutsPlugin,
  TableOfContentsPlugin,
} from '../plugins';
import type { CodeElement } from '../plugins/CodeBlockPlugin/types';
import { Backdrop } from './Backdrop';
import { colors } from './colors';
import { DragBlock } from './DragBlock';
import { FloatingMenu } from './FloatingMenu';
import { getCommands } from './getCommands';
import { getShortcuts } from './getShortcuts';
import { LanguageSelector } from './LanguageSelector';
import { LinksHint } from './LinksHint';
import { Menu } from './Menu';
import { $store } from './store';

export const getPlugins = () => {
  const floatingMenuPlugin = new FloatingMenuPlugin({
    ignoreNodes: [CodeBlockPlugin.CODE_ELEMENT],
    renderMenu: (editor: Editor, commands: Commands) => {
      return (
        <FloatingMenu $store={$store} editor={editor} commands={commands} />
      );
    },
    renderBackdrop: (commands) => {
      const handleClose = () => {
        commands.onClose();
        $store.setKey('isFloatingMenuOpen', false);
      };

      return <Backdrop onClose={handleClose} />;
    },
    onShow: () => {
      $store.setKey('isFloatingMenuOpen', true);
      return true;
    },
    onHide: () => {
      if ($store.get().floatingMenuMode === 'main') {
        $store.setKey('isFloatingMenuOpen', false);
        $store.setKey('url', undefined);
        return false;
      }

      return true;
    },
  });

  return [
    new BasicFormattingPlugin(),
    new PlaceholderPlugin({
      focused: 'Write / to open command menu',
      unfocused: 'Write / to open command menu',
      ignoreNodes: [CodeBlockPlugin.CODE_LINE_ELEMENT],
    }),
    new NodeIdPlugin({
      generateId: () => Math.random().toString(36).substring(2, 15),
    }),
    new HeadingsPlugin(),
    new MenuPlugin({
      renderMenu: ({ editor }) => {
        return <Menu editor={editor} />;
      },
    }),
    new DnDPlugin({
      renderBlock: (params) => {
        return <DragBlock {...params} />;
      },
      onDropFiles: () => {},
      ignoreNodes: [
        CodeBlockPlugin.CODE_LINE_ELEMENT,
        ListsPlugin.BULLETED_LIST_ELEMENT,
        ListsPlugin.NUMBERED_LIST_ELEMENT,
      ],
    }),
    new ShortcutsPlugin({
      shortcuts: getShortcuts(),
      ignoreNodes: [
        CodeBlockPlugin.CODE_ELEMENT,
        CodeBlockPlugin.CODE_LINE_ELEMENT,
      ],
    }),
    new LinksPlugin({
      renderHint: (methods) => (
        <LinksHint floatingMenuPlugin={floatingMenuPlugin} methods={methods} />
      ),
    }),
    new CommandsPlugin({
      commands: getCommands(),
      renderMenu: (children) => {
        return <div>{children}</div>;
      },
      ignoreNodes: [CodeBlockPlugin.CODE_LINE_ELEMENT],
    }),
    new TableOfContentsPlugin({
      levels: {
        [HeadingsPlugin.HeadingLevel1]: 1,
        [HeadingsPlugin.HeadingLevel2]: 2,
        [HeadingsPlugin.HeadingLevel3]: 3,
      },
    }),
    floatingMenuPlugin,
    new HighlightsPlugin({
      colors,
    }),
    new BreaksPlugin({
      breakNodes: [
        HeadingsPlugin.HeadingLevel1,
        HeadingsPlugin.HeadingLevel2,
        HeadingsPlugin.HeadingLevel3,
      ],
    }),
    new ListsPlugin({}),
    new CodeBlockPlugin({
      renderLanguageSelector: (value, onChange, params) => {
        return (
          <LanguageSelector
            value={value}
            onChange={onChange}
            params={{
              ...params,
              element: params.element as CodeElement,
            }}
          />
        );
      },
    }),
  ];
};
