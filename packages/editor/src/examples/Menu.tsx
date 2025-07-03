import type { Editor } from 'slate';
import { Heading1Icon } from '../icons/heading1';
import { Heading2Icon } from '../icons/heading2';
import { Heading3Icon } from '../icons/heading3';
import { OlIcon } from '../icons/ol';
import { UlIcon } from '../icons/ul';
import { HeadingsPlugin, ListsPlugin } from '../plugins';
import styles from './Menu.module.css';

type Props = {
  editor: Editor;
};

export const Menu = (props: Props) => {
  const { editor } = props;

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
          ListsPlugin.toggleList(editor, ListsPlugin.BULLETED_LIST_ELEMENT);
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
          ListsPlugin.toggleList(editor, ListsPlugin.NUMBERED_LIST_ELEMENT);
        }}
      >
        <OlIcon size={16} />
      </button>
    </div>
  );
};

const getButtonClassName = (isActive: boolean) => {
  return isActive ? [styles.button, styles.active].join(' ') : styles.button;
};
