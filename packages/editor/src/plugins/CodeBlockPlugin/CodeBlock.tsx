import type { ReactNode } from 'react';
import type { RenderElementProps } from 'slate-react';
import styles from './styles.module.css';
import type { CodeElement } from './types';

type Props = RenderElementProps & {
  element: CodeElement;
  renderLanguageSelector: (element: CodeElement) => ReactNode;
};

export const CodeBlock = (props: Props) => {
  return (
    <div {...props.attributes} className={styles.root} spellCheck={false}>
      <div contentEditable={false}>
        {props.renderLanguageSelector(props.element)}
      </div>
      <div className={styles.content}>
        <div className={styles.code}>{props.children}</div>
      </div>
    </div>
  );
};
