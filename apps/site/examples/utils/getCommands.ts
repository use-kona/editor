import {
  CodeBlockPlugin,
  type Command,
  HeadingsPlugin,
  ListsPlugin,
} from '@use-kona/editor';
import {
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  OlIcon,
  TextIcon,
  UlIcon,
} from '../icons';
import { createElement } from 'react';

export const getCommands = ({
  listsPlugin,
}: {
  listsPlugin: ListsPlugin;
}): Command[] => {
  return [
    {
      name: 'paragraph',
      title: 'Paragraph',
      icon: createElement(TextIcon, { size: 16 }),
      commandName: 'paragraph',
      action: (actions) => {
        actions.set({ type: 'paragraph' });
      },
    },
    {
      name: 'heading-1',
      title: 'Heading 1',
      commandName: 'heading1',
      icon: createElement(Heading1Icon, { size: 16 }),
      action: (actions) => {
        actions.set({ type: HeadingsPlugin.HeadingLevel1 });
      },
    },
    {
      name: 'heading-2',
      title: 'Heading 2',
      commandName: 'heading2',
      icon: createElement(Heading2Icon, { size: 16 }),
      action: (actions) => {
        actions.set({ type: HeadingsPlugin.HeadingLevel2 });
      },
    },
    {
      name: 'heading-3',
      title: 'Heading 3',
      commandName: 'heading3',
      icon: createElement(Heading3Icon, { size: 16 }),
      action: (actions) => {
        actions.set({ type: HeadingsPlugin.HeadingLevel3 });
      },
    },
    {
      name: 'ul',
      title: 'Bulleted list',
      commandName: 'bulleted list',
      icon: createElement(UlIcon, { size: 16 }),
      action: (actions, editor) => {
        actions.removeCommand();
        listsPlugin.toggleList(
          editor,
          ListsPlugin.BULLETED_LIST_ELEMENT,
          ListsPlugin.LIST_ITEM_ELEMENT,
        );
      },
    },
    {
      name: 'ol',
      title: 'Numbered list',
      commandName: 'numbered list',
      icon: createElement(OlIcon, { size: 16 }),
      action: (actions, editor) => {
        actions.removeCommand();
        listsPlugin.toggleList(
          editor,
          ListsPlugin.NUMBERED_LIST_ELEMENT,
          ListsPlugin.LIST_ITEM_ELEMENT,
        );
      },
    },
    {
      name: 'code',
      title: 'Code',
      commandName: 'code',
      icon: createElement(CodeIcon, { size: 16 }),
      action: (actions, editor) => {
        actions.removeCommand();
        CodeBlockPlugin.toggleCodeBlock(editor);
      },
    },
  ];
};
