export type EmojiElement = {
  type: 'emoji';
  emoji: string;
  children: [{ text: string }];
};
