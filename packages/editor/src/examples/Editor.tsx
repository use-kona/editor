import '../../css.d.ts';
// External dependencies
import { useStore } from '@nanostores/react';

import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Editor, Transforms } from 'slate';

import { ELEMENT_PARAGRAPH } from '../constants';
// Core components
import { KonaEditor } from '../editor';
// Icons

import { Heading1Icon } from '../icons/heading1';
import { Heading2Icon } from '../icons/heading2';
import { Heading3Icon } from '../icons/heading3';
import { UlIcon } from '../icons/ul';
import type { ChangeMatch, Command, Commands, Shortcut } from '../plugins';
// Plugins
import {
  BasicFormattingPlugin,
  BreaksPlugin,
  CodeBlockPlugin,
  CommandsPlugin,
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
import type { CodeElement } from '../plugins/CodeBlockPlugin/type';
import type { UiParams } from '../types';
import { colors } from './colors';
import { FloatingMenu } from './FloatingMenu';
import { LanguageSelector } from './LanguageSelector';
import { LinksHint } from './LinksHint';
import { $store } from './store';
// Local styles
import styles from './styles.module.css';

type CustomElement = { type: string; children: CustomText[] } | CodeElement;
type CustomText = { text: string };

const initialValue = [
  {
    type: HeadingsPlugin.HeadingLevel1,
    children: [{ text: 'A line of text in a paragraph.' }],
  },
  {
    type: ELEMENT_PARAGRAPH,
    children: [{ text: '312' }],
  },
  {
    type: 'void',
    children: [{ text: '' }],
  },
  {
    type: 'void2',
    children: [{ text: '' }],
  },
  {
    type: ELEMENT_PARAGRAPH,
    children: [{ text: '123' }],
  },
  {
    type: CodeBlockPlugin.CODE_ELEMENT,
    children: [
      {
        type: CodeBlockPlugin.CODE_LINE_ELEMENT,
        children: [{ text: 'console.log("Hello world");' }],
      },
    ],
    language: 'javascript',
  },
];

const getButtonClassName = (isActive: boolean) => {
  return isActive ? [styles.button, styles.active].join(' ') : styles.button;
};

const commands: Command[] = [
  {
    name: 'paragraph',
    title: 'Paragraph',
    icon: null,
    commandName: 'paragraph',
    action: (actions) => {
      actions.set({ type: 'paragraph' });
    },
  },
  {
    name: 'heading-1',
    title: 'Heading 1',
    commandName: 'heading-1',
    icon: null,
    action: (actions) => {
      actions.set({ type: HeadingsPlugin.HeadingLevel1 });
    },
  },
  {
    name: 'heading-2',
    title: 'Heading 2',
    commandName: 'heading-2',
    icon: null,
    action: (actions) => {
      actions.set({ type: HeadingsPlugin.HeadingLevel2 });
    },
  },
  {
    name: 'heading-3',
    title: 'Heading 3',
    commandName: 'heading-3',
    icon: null,
    action: (actions) => {
      actions.set({ type: HeadingsPlugin.HeadingLevel3 });
    },
  },
];

const renderMenu = ({ editor }: UiParams) => {
  return (
    <div className={styles.menu}>
      <button
        type="button"
        className={getButtonClassName(HeadingsPlugin.isHeading1Active(editor))}
        onMouseDown={(event) => {
          event.preventDefault();
          HeadingsPlugin.toggleHeading1(editor);
        }}
      >
        <Heading1Icon size={16} />
      </button>
      <button
        type="button"
        className={getButtonClassName(HeadingsPlugin.isHeading2Active(editor))}
        onMouseDown={(event) => {
          event.preventDefault();
          HeadingsPlugin.toggleHeading2(editor);
        }}
      >
        <Heading2Icon size={16} />
      </button>
      <button
        type="button"
        className={getButtonClassName(HeadingsPlugin.isHeading3Active(editor))}
        onMouseDown={(event) => {
          event.preventDefault();
          HeadingsPlugin.toggleHeading3(editor);
        }}
      >
        <Heading3Icon size={16} />
      </button>
      <span className={styles.divider} />
      <button
        type="button"
        className={getButtonClassName(
          ListsPlugin.isListActive(editor, ListsPlugin.BULLETED_LIST_ELEMENT),
        )}
        onMouseDown={(event) => {
          event.preventDefault();
          ListsPlugin.toggleList(editor, ListsPlugin.BULLETED_LIST_ELEMENT);
        }}
      >
        <UlIcon size={16} />
      </button>
    </div>
  );
};

const replaceWithMarkedText = (
  editor: Editor,
  match: ChangeMatch,
  mark: string,
) => {
  Editor.withoutNormalizing(editor, () => {
    if (!editor.selection) {
      return;
    }

    Transforms.delete(editor, {
      at: editor.selection?.focus,
      distance: match.text?.length || 0,
      reverse: true,
      unit: 'character',
    });
    Transforms.insertText(editor, match.cleanText || '');
    Transforms.setSelection(editor, {
      anchor: editor.selection?.focus,
      focus: {
        path: editor.selection?.focus.path,
        offset: editor.selection?.focus.offset - (match.cleanText?.length || 0),
      },
    });
    Editor.addMark(editor, mark, true);
    Transforms.setSelection(editor, {
      anchor: editor.selection.anchor,
      focus: editor.selection.anchor,
    });
  });
};

const replaceWithHeading = (
  editor: Editor,
  match: ChangeMatch,
  type: string,
) => {
  Editor.withoutNormalizing(editor, () => {
    const { selection } = editor;

    if (selection) {
      Transforms.delete(editor, {
        at: selection.focus,
        distance: match.before?.[0].length,
        reverse: true,
        unit: 'character',
      });

      Transforms.setNodes(editor, {
        type,
      });
    }
  });
};

const shortcuts: Shortcut[] = [
  {
    trigger: ' ',
    before: /\*\*/g,
    after: /\*\*/g,
    change(editor: Editor, match) {
      replaceWithMarkedText(editor, match, 'bold');
    },
  },
  {
    trigger: ' ',
    before: /\*/g,
    after: /\*/g,
    change(editor: Editor, match) {
      replaceWithMarkedText(editor, match, 'italic');
    },
  },
  {
    trigger: ' ',
    before: /~~/g,
    after: /~~/g,
    change(editor: Editor, match) {
      replaceWithMarkedText(editor, match, 'strikethrough');
    },
  },
  {
    trigger: ' ',
    before: /^###/g,
    change(editor, match) {
      replaceWithHeading(editor, match, HeadingsPlugin.HeadingLevel3);
    },
  },
  {
    trigger: ' ',
    before: /^##/g,
    change(editor, match) {
      replaceWithHeading(editor, match, HeadingsPlugin.HeadingLevel2);
    },
  },
  {
    trigger: ' ',
    before: /^#/g,
    change(editor, match) {
      replaceWithHeading(editor, match, HeadingsPlugin.HeadingLevel1);
    },
  },
];

export const ExampleEditor = () => {
  const [darkTheme, setDarkTheme] = useState(false);

  const renderFloatingMenu = (editor: Editor, commands: Commands) => {
    return <FloatingMenu $store={$store} editor={editor} commands={commands} />;
  };

  const [floatingMenuPlugin] = useState(
    () =>
      new FloatingMenuPlugin({
        ignoreNodes: [CodeBlockPlugin.CODE_ELEMENT],
        renderMenu: renderFloatingMenu,
        renderBackdrop: (commands) => {
          const { isFloatingMenuOpen } = useStore($store);

          const handleClose = () => {
            commands.onClose();
            $store.setKey('isFloatingMenuOpen', false);
          };

          if (isFloatingMenuOpen) {
            return <div className={styles.backdrop} onClick={handleClose} />;
          }

          return null;
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
      }),
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <label>
        <input
          type="checkbox"
          checked={darkTheme}
          onChange={() => {
            setDarkTheme(!darkTheme);
            document.body.classList.toggle('dark-theme', !darkTheme);
          }}
        />{' '}
        Dark Theme
      </label>
      <div
        className={[
          styles.root,
          darkTheme ? styles['dark-theme'] : styles['light-theme'],
        ].join(' ')}
      >
        <KonaEditor
          initialValue={initialValue as CustomElement[]}
          plugins={[
            new BasicFormattingPlugin(),
            new PlaceholderPlugin({
              focused: 'Write / to open command menu',
              unfocused: 'Write / to open command menu',
              ignoreNodes: [CodeBlockPlugin.CODE_LINE_ELEMENT],
            }),
            new NodeIdPlugin({
              generateId: () => '123',
            }),
            new HeadingsPlugin(),
            new MenuPlugin({
              renderMenu,
            }),
            // new DnDPlugin({
            //   renderBlock: () => {
            //
            //   },
            //   onDropFiles: console.log,
            //   ignoreNodes: [
            //     CodeBlockPlugin.CODE_LINE_ELEMENT,
            //     ListsPlugin.BULLETED_LIST_ELEMENT,
            //     ListsPlugin.NUMBERED_LIST_ELEMENT,
            //   ],
            // }),
            new ShortcutsPlugin({
              shortcuts,
              ignoreNodes: [
                CodeBlockPlugin.CODE_ELEMENT,
                CodeBlockPlugin.CODE_LINE_ELEMENT,
              ],
            }),
            new LinksPlugin({
              renderHint: (methods) => (
                <LinksHint
                  floatingMenuPlugin={floatingMenuPlugin}
                  methods={methods}
                />
              ),
            }),
            new CommandsPlugin({
              commands,
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
          ]}
          onChange={console.log}
        />
      </div>
    </DndProvider>
  );
};
