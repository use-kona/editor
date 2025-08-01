import { Editor, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import type { FloatingMenuPlugin, OptionsMethods } from '@use-kona/editor';
import { EditIcon } from './icons/edit';
import { ExternalIcon } from './icons/external';
import styles from './LinksHint.module.css';
import { $store } from './store';

type Props = {
  methods: OptionsMethods;
  floatingMenuPlugin: FloatingMenuPlugin;
};

export const LinksHint = (props: Props) => {
  const { methods, floatingMenuPlugin } = props;

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.button}
        onMouseDown={(event) => {
          event.preventDefault();
          const element = methods.getLinkElement();
          const editor = methods.getEditor();
          const url = methods.getUrl();

          if (!element) {
            return;
          }

          const domElement = ReactEditor.toDOMNode(editor, element);
          const path = ReactEditor.findPath(editor, element);
          const range = Editor.range(editor, path);
          Transforms.select(editor, range);

          floatingMenuPlugin.openOnElement(domElement);
          $store.setKey('floatingMenuMode', 'link');
          $store.setKey('isFloatingMenuOpen', true);
          $store.setKey('url', url);
        }}
      >
        <EditIcon size={16} />
      </button>
      <button
        type="button"
        className={styles.button}
        onMouseDown={(event) => {
          event.preventDefault();
          const url = methods.getUrl();
          window.open(url, '_blank');
        }}
      >
        <ExternalIcon size={16} />
      </button>
    </div>
  );
};
