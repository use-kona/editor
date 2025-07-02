import { RenderElementProps } from 'slate-react';
import { CodeElement } from './type';
import { ReactNode } from 'react';
import styles from './styles.module.css';

type Props = RenderElementProps & {
  element: CodeElement;
  renderLanguageSelector: (element: CodeElement) => ReactNode;
};

export const CodeBlock = (props: Props) => {
  return (
    <div {...props.attributes} className={styles.code} spellCheck={false}>
      <div contentEditable={false}>{props.renderLanguageSelector(props.element)}</div>
      <div className={styles.content}>{props.children}</div>
    </div>
  );
};
