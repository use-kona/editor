import { createElement } from 'react';

import { CodeBlockPlugin, EmojiPlugin } from '@use-kona/editor';

import { $store } from '../../store';
import { EmojiSelector } from './EmojiSelector';
import Emoji from './Emoji';

export default () =>
  new EmojiPlugin({
    ignoreNodes: [CodeBlockPlugin.CODE_LINE_ELEMENT],
    onSearch: (query) => $store.setKey('emojiSearch', query),
    renderMenu: ({ insertEmoji }) => {
      return createElement(EmojiSelector, {
        onConfirm: (...params) => {
          insertEmoji(...params);
          $store.setKey('emojiSearch', '');
        },
      });
    },
    renderEmoji: (emoji) => {
      return createElement(Emoji, { id: emoji });
    },
  });
