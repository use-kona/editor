import { type Command, HeadingsPlugin } from '../plugins';

export const getCommands = (): Command[] => {
  return [
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
};
