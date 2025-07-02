import type { Descendant } from 'slate';

export const defaultValue: { children: Descendant[] } = {
  children: [
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ],
};
