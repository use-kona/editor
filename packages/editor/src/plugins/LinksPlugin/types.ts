import type { LINK_ELEMENT } from './constants';
import type { Editor } from 'slate';
import type { ReactNode } from 'react';

export type LinkElement = {
  type: typeof LINK_ELEMENT;
  url: string;
  children: [{ text: string }] | [];
};

export type Options = {
  renderHint: (methods: OptionsMethods) => ReactNode;
};

export type OptionsMethods = {
  getLinkElement: () => LinkElement | null;
  getUrl: () => string;
  getEditor: () => Editor;
};
