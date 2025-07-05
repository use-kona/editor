import type { RenderElementProps } from 'slate-react';
import styles from './styles.module.css';

export const CodeBlockLine = (props: RenderElementProps) => (
  <div
    {...props.attributes}
    style={{ position: 'relative' }}
    className={styles.line}
  >
    {props.children}
  </div>
);
