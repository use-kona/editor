import { RenderElementProps } from 'slate-react';

export const CodeBlockLine = (props: RenderElementProps) => (
  <div {...props.attributes} style={{ position: 'relative' }}>
    {props.children}
  </div>
);
