import type { RenderElementProps } from 'slate-react';

export const BaseElement = (props: RenderElementProps) => {
  return <p {...props.attributes}>{props.children}</p>;
};
