import { type Command, HeadingsPlugin, ListsPlugin } from '../plugins';
import { Heading1Icon } from './icons/heading1';
import { Heading2Icon } from './icons/heading2';
import { Heading3Icon } from './icons/heading3';
import { OlIcon } from './icons/ol';
import { TextIcon } from './icons/text';
import { UlIcon } from './icons/ul';

export const getCommands = (): Command[] => {
  return [
    {
      name: 'paragraph',
      title: 'Paragraph',
      icon: <TextIcon size={16} />,
      commandName: 'paragraph',
      action: (actions) => {
        actions.set({ type: 'paragraph' });
      },
    },
    {
      name: 'heading-1',
      title: 'Heading 1',
      commandName: 'heading1',
      icon: <Heading1Icon size={16} />,
      action: (actions) => {
        actions.set({ type: HeadingsPlugin.HeadingLevel1 });
      },
    },
    {
      name: 'heading-2',
      title: 'Heading 2',
      commandName: 'heading2',
      icon: <Heading2Icon size={16} />,
      action: (actions) => {
        actions.set({ type: HeadingsPlugin.HeadingLevel2 });
      },
    },
    {
      name: 'heading-3',
      title: 'Heading 3',
      commandName: 'heading3',
      icon: <Heading3Icon size={16} />,
      action: (actions) => {
        actions.set({ type: HeadingsPlugin.HeadingLevel3 });
      },
    },
    {
      name: 'ul',
      title: 'Bulleted list',
      commandName: 'bulleted list',
      icon: <UlIcon size={16} />,
      action: (actions, editor) => {
        actions.removeCommand();
        ListsPlugin.toggleList(
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
      icon: <OlIcon size={16} />,
      action: (actions, editor) => {
        actions.removeCommand();
        ListsPlugin.toggleList(
          editor,
          ListsPlugin.NUMBERED_LIST_ELEMENT,
          ListsPlugin.LIST_ITEM_ELEMENT,
        );
      },
    },
  ];
};
