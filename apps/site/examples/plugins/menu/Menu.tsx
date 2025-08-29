import type { Editor } from 'slate';
import { CodeBlockPlugin, HeadingsPlugin, ListsPlugin } from '@use-kona/editor';
import {
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  OlIcon,
  UlIcon,
} from '../../icons';
import styles from './Menu.module.css';

type Props = {
  editor: Editor;
  listsPlugin: ListsPlugin;
};

const Menu = (props: Props) => {
  const { editor, listsPlugin } = props;

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={getButtonClassName(HeadingsPlugin.isHeading1Active(editor))}
        onMouseDown={(event) => {
          event.preventDefault();
          HeadingsPlugin.toggleHeading1(editor);
        }}
      >
        <Heading1Icon size={16} />
      </button>
      <button
        type="button"
        className={getButtonClassName(HeadingsPlugin.isHeading2Active(editor))}
        onMouseDown={(event) => {
          event.preventDefault();
          HeadingsPlugin.toggleHeading2(editor);
        }}
      >
        <Heading2Icon size={16} />
      </button>
      <button
        type="button"
        className={getButtonClassName(HeadingsPlugin.isHeading3Active(editor))}
        onMouseDown={(event) => {
          event.preventDefault();
          HeadingsPlugin.toggleHeading3(editor);
        }}
      >
        <Heading3Icon size={16} />
      </button>
      <span className={styles.divider} />
      <button
        type="button"
        className={getButtonClassName(
          ListsPlugin.isListActive(editor, ListsPlugin.BULLETED_LIST_ELEMENT),
        )}
        onMouseDown={(event) => {
          event.preventDefault();
          listsPlugin.toggleList(editor, ListsPlugin.BULLETED_LIST_ELEMENT);
        }}
      >
        <UlIcon size={16} />
      </button>
      <button
        type="button"
        className={getButtonClassName(
          ListsPlugin.isListActive(editor, ListsPlugin.NUMBERED_LIST_ELEMENT),
        )}
        onMouseDown={(event) => {
          event.preventDefault();
          listsPlugin.toggleList(editor, ListsPlugin.NUMBERED_LIST_ELEMENT);
        }}
      >
        <OlIcon size={16} />
      </button>
      <span className={styles.divider} />
      <button
        type="button"
        className={getButtonClassName(
          CodeBlockPlugin.isCodeBlockActive(editor),
        )}
        onMouseDown={(event) => {
          event.preventDefault();
          CodeBlockPlugin.toggleCodeBlock(editor);
        }}
      >
        <CodeIcon size={16} />
      </button>
    </div>
  );
};

const getButtonClassName = (isActive: boolean) => {
  return isActive ? [styles.button, styles.active].join(' ') : styles.button;
};

export default Menu;
