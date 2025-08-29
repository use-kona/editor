import create from './create';
import Emoji from './Emoji';
import { EmojiSelector } from './EmojiSelector';

export const emojiPlugin = {
  create,
  components: {
    Emoji,
    EmojiSelector,
  },
};
