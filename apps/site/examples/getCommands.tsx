import {
  CodeBlockPlugin,
  type Command,
  HeadingsPlugin,
  ListsPlugin,
} from '@use-kona/editor';
import { CodeIcon } from './icons/code';
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
      name: 'headings',
      title: 'Headings',
      commandName: 'headings',
      icon: <Heading1Icon size={16} />,
      getCommands: () => [
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
      ],
    },
    {
      name: 'lists',
      title: 'Lists',
      commandName: 'lists',
      icon: <UlIcon size={16} />,
      getCommands: () => [
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
      ],
    },
    {
      name: 'advanced',
      title: 'Advanced',
      commandName: 'advanced',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 12l8 -4.5" />
          <path d="M12 12v9" />
          <path d="M12 12l-8 -4.5" />
          <path d="M12 12l8 4.5" />
          <path d="M12 3v9" />
          <path d="M12 12l-8 4.5" />
        </svg>
      ),
      getCommands: async ({ query }) => {
        await new Promise((resolve) => {
          setTimeout(resolve, 200);
        });

        const commands: Command[] = [
          {
            name: 'code',
            title: 'Code',
            commandName: 'code',
            icon: <CodeIcon size={16} />,
            action: (actions, editor) => {
              actions.removeCommand();
              CodeBlockPlugin.toggleCodeBlock(editor);
            },
          },
          {
            name: 'quote',
            title: 'Quote',
            commandName: 'quote',
            icon: <TextIcon size={16} />,
            action: (actions) => {
              actions.removeCommand();
              actions.insertText('> ');
            },
          },
        ];

        return commands.filter((command) => {
          const normalized = query.toLocaleLowerCase();
          if (!normalized) {
            return true;
          }

          return (
            command.commandName.toLocaleLowerCase().includes(normalized) ||
            command.title.toLocaleLowerCase().includes(normalized)
          );
        });
      },
    },
  ];
};
