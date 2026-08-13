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

    const isHidden = isHiddenByCollapsedBoundary(editor, path, this.types);

    if (isHidden) {
      return (
        <div className={styles.hidden} data-collapsible-block-hidden hidden>
          {props.children}
        </div>
      );
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

    return props.children;
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

const isHiddenByCollapsedBoundary = (
  editor: Editor,
  path: Path,
  types: string[],
) => {
  for (let index = 0; index < path[0]; index++) {
    const node = editor.children[index] as CollapsibleElement;

    if (
      Element.isElement(node) &&
      node.collapsed === true &&
      types.includes(node.type) &&
      path[0] < getSectionEnd(editor, index, types)
    ) {
      return true;
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

  return selectionIndex < getSectionEnd(editor, boundaryPath[0], types);
};

const getSectionEnd = (
  editor: Editor,
  boundaryIndex: number,
  types: string[],
) => {
  const boundary = editor.children[boundaryIndex] as CollapsibleElement;
  const boundaryLevel = types.indexOf(boundary.type);

  for (let index = boundaryIndex + 1; index < editor.children.length; index++) {
    const node = editor.children[index];
    const nodeLevel = Element.isElement(node) ? types.indexOf(node.type) : -1;

    if (nodeLevel !== -1 && nodeLevel <= boundaryLevel) {
      return index;
    }
  }

  return editor.children.length;
};
