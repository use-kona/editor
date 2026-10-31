import { useStore } from '@nanostores/react';
import { type MapStore, map } from 'nanostores';
import { Fragment, type MouseEvent, type ReactNode, useEffect } from 'react';
import { Editor, type NodeEntry, Operation, Text } from 'slate';
import { ReactEditor } from 'slate-react';
import type { CustomElement, CustomText } from '../../../types';
import type { IPlugin, UiParams } from '../../types';
import { scrollToHeading } from './scrollToHeading';
import styles from './styles.module.css';

type Options = {
  levels: Record<string, 1 | 2 | 3>;
  /** Use the same emoji ID renderer as EmojiPlugin, including custom emojis. */
  renderEmoji?: (emoji: string) => ReactNode;
};

export class TableOfContentsPlugin implements IPlugin {
  $store: MapStore<{ headings: NodeEntry<CustomElement>[] }>;

  constructor(private options: Options) {
    this.$store = map({
      headings: [],
    });
  }

  private renderHeadingContent(node: CustomElement | CustomText): ReactNode {
    if (Text.isText(node)) {
      return node.text;
    }

    if (
      node.type === 'emoji' &&
      'emoji' in node &&
      typeof node.emoji === 'string'
    ) {
      const emoji = this.options.renderEmoji?.(node.emoji);

      return emoji == null ? null : (
        <span className={styles.emoji}>{emoji}</span>
      );
    }

    return node.children.map((child, index) => (
      <Fragment key={index}>{this.renderHeadingContent(child)}</Fragment>
    ));
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
          scrollToHeading(element);
        };

        return (
          <div
            key={path.join('-')}
            className={styles[`h${level}`]}
            onMouseDown={handleMouseDown}
          >
            {this.renderHeadingContent(node)}
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
