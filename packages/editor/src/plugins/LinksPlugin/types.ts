import { LINK_ELEMENT } from './constants';
import { Editor } from 'slate';
import { ReactNode } from 'react';

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
