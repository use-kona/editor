import { Editor } from 'slate';
import type { RenderLeafProps } from 'slate-react';
import type { IPlugin } from '../../types';

type HighlightElement = {
  highlight: string;
};

type Options = {
  colors: Record<string, string>;
};

export class HighlightsPlugin implements IPlugin {
  constructor(private options: Options) {}

  static toggleHighlight(editor: Editor, color: string) {
    const isActive = HighlightsPlugin.isHighlightActive(editor, color);
    if (isActive) {
      Editor.removeMark(editor, 'highlight');
    } else {
      Editor.addMark(editor, 'highlight', color);
    }
  }

  static isHighlightActive(editor: Editor, color: string) {
    const marks: Record<string, string> | null = Editor.marks(editor);
    return marks ? marks.highlight === color : false;
  }

  static removeHighlight(editor: Editor) {
    Editor.removeMark(editor, 'highlight');
  }

  leafs = [
    {
      render: (props: RenderLeafProps) => {
        const { leaf, attributes, children } = props;

        let content = children;

        if ((leaf as unknown as HighlightElement).highlight) {
          content = (
            <span
              style={{
                backgroundColor:
                  this.options.colors[
                    (leaf as unknown as HighlightElement).highlight
                  ],
              }}
            >
              {content}
            </span>
          );
        }

        return <span {...attributes}>{content}</span>;
      },
    },
  ];
}
