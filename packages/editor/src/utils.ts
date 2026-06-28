import { type Descendant, Text } from 'slate';

export const isEmpty = (children: Descendant[]) => {
  const [first] = children || [];

  if (Text.isText(first)) {
    return first.text.trim() === '';
  }

  if (children && children.length <= 1 && first && 'children' in first) {
    return first.children.every(
      (child) => Text.isText(child) && child.text?.trim() === '',
    );
  }

  return false;
};
