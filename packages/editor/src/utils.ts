import { type Descendant, Text } from 'slate';

export const isEmpty = (children: Descendant[]) => {
  const [first] = children || [];

  if (Text.isText(first)) {
    return first.text.trim() === '';
  }

  if (children && children.length <= 1 && Text.isText(first?.children?.[0])) {
    return first.children[0].text === '';
  }

  return false;
};
