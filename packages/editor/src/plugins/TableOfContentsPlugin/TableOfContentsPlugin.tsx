import { useStore } from '@nanostores/react';
import { type MapStore, map } from 'nanostores';
import { type MouseEvent, useEffect } from 'react';
import { Editor, type NodeEntry, Operation } from 'slate';
import { ReactEditor } from 'slate-react';
import type { CustomElement } from '../../../types';
import type { IPlugin, UiParams } from '../../types';
import styles from './styles.module.css';

type Options = {
  levels: Record<string, 1 | 2 | 3>;
};

export class TableOfContentsPlugin implements IPlugin {
  $store: MapStore<{ headings: NodeEntry<CustomElement>[] }>;

  constructor(private options: Options) {
    this.$store = map({
      headings: [],
    });
  }

  init(editor: Editor) {
    const { onChange } = editor;

    editor.onChange = (options) => {
      if (!Operation.isSelectionOperation(options?.operation?.type)) {
        const nodes = Array.from(
          Editor.nodes<CustomElement>(editor, {
            at: [],
            match: (node) => {
              return (node as CustomElement).type in this.options.levels;
            },
          }),
        );
        this.$store.setKey('headings', nodes);
      }

      onChange(options);
    };

    return editor;
  }

  ui(params: UiParams) {
    useEffect(() => {
      const nodes = Array.from(
        Editor.nodes<CustomElement>(params.editor, {
          at: [],
          match: (node) => {
            return (node as CustomElement).type in this.options.levels;
          },
        }),
      );
      this.$store.setKey('headings', nodes);
    }, []);

    const { headings } = useStore(this.$store);

    const headingsMini = headings.map(
      ([node, path]: NodeEntry<CustomElement>) => {
        const level = this.options.levels[node.type];

        return <div key={path.join('-')} className={styles[`h${level}`]} />;
      },
    );

    const headingsMax = headings.map(
      ([node, path]: NodeEntry<CustomElement>) => {
        const level = this.options.levels[node.type];

        const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
          event.preventDefault();
          const element = ReactEditor.toDOMNode(
            params.editor,
            node,
          ) as HTMLElement;
          element?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        };

        return (
          <div
            key={path.join('-')}
            className={styles[`h${level}`]}
            onMouseDown={handleMouseDown}
          >
            {node.children[0].text}
          </div>
        );
      },
    );

    return (
      <div className={styles.toc}>
        <div className={styles.mini}>{headingsMini}</div>
        <div className={styles.max}>{headingsMax}</div>
      </div>
    );
  }
}
