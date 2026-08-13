import type { ReactNode } from 'react';
import { Editor, Element, type Path, Range, Transforms } from 'slate';
import { ReactEditor, type RenderElementProps, useSlate } from 'slate-react';
import type { CustomElement } from '../../../types';
import type { IPlugin } from '../../types';
import styles from './styles.module.css';

type CollapsibleElement = CustomElement & {
  collapsed?: boolean;
};

export class CollapsibleBlocksPlugin implements IPlugin {
  constructor(private types: string[]) {}

  renderBlock = (props: RenderElementProps) => {
    const editor = useSlate();
    const path = ReactEditor.findPath(editor, props.element);

    if (path.length !== 1) {
      return props.children;
    }

    if (this.types.includes(props.element.type)) {
      return (
        <CollapsibleBoundary
          editor={editor}
          element={props.element as CollapsibleElement}
          path={path}
          types={this.types}
        >
          {props.children}
        </CollapsibleBoundary>
      );
    }

    return isHiddenByPreviousBoundary(editor, path, this.types) ? (
      <div className={styles.hidden} hidden>
        {props.children}
      </div>
    ) : (
      props.children
    );
  };
}

const CollapsibleBoundary = ({
  children,
  editor,
  element,
  path,
  types,
}: {
  children: ReactNode;
  editor: Editor;
  element: CollapsibleElement;
  path: Path;
  types: string[];
}) => {
  const isCollapsed = element.collapsed === true;

  const toggle = () => {
    const willCollapse = !isCollapsed;

    Transforms.setNodes<CollapsibleElement>(
      editor,
      { collapsed: willCollapse },
      { at: path },
    );

    if (willCollapse && isSelectionInsideSection(editor, path, types)) {
      Transforms.select(editor, Editor.start(editor, path));
    }
  };

  return (
    <div className={styles.boundary}>
      <button
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
        className={
          isCollapsed ? styles.chevron : `${styles.chevron} ${styles.expanded}`
        }
        contentEditable={false}
        onClick={toggle}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          width="16"
        >
          <path d="M0 0h24v24H0z" fill="none" stroke="none" />
          <path d="M9 6l6 6l-6 6" />
        </svg>
      </button>
      {children}
    </div>
  );
};

const isHiddenByPreviousBoundary = (
  editor: Editor,
  path: Path,
  types: string[],
) => {
  for (let index = path[0] - 1; index >= 0; index--) {
    const node = editor.children[index] as CollapsibleElement;

    if (Element.isElement(node) && types.includes(node.type)) {
      return node.collapsed === true;
    }
  }

  return false;
};

const isSelectionInsideSection = (
  editor: Editor,
  boundaryPath: Path,
  types: string[],
) => {
  const { selection } = editor;

  if (!selection || !Range.isCollapsed(selection)) {
    return false;
  }

  const selectionIndex = selection.focus.path[0];

  if (selectionIndex <= boundaryPath[0]) {
    return false;
  }

  for (
    let index = boundaryPath[0] + 1;
    index < editor.children.length;
    index++
  ) {
    const node = editor.children[index];

    if (Element.isElement(node) && types.includes(node.type)) {
      return selectionIndex < index;
    }
  }

  return true;
};
