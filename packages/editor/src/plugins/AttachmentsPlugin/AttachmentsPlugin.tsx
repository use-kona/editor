import type { Editor } from 'slate';
import type { RenderElementProps } from 'slate-react';
import type { IPlugin } from '../../types';
import type { Options } from './types';

export class AttachmentsPlugin implements IPlugin {
  constructor(private options: Options) {}

  static ATTACHMENT_ELEMENT = 'attach';

  handlers = {
    onPaste: (event: ClipboardEvent, editor: Editor) => {
      const items = Array.from(event.clipboardData?.items || []);
      for (const item of items) {
        if (item?.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            this.options.onPaste?.(editor, file);
          }
        }
      }
    },
  };

  blocks = [
    {
      type: AttachmentsPlugin.ATTACHMENT_ELEMENT,
      isVoid: true,
      render: (props: RenderElementProps) => {
        const { Attachment } = this.options;

        return (
          <div {...props.attributes} contentEditable={false}>
            {props.children}
            <Attachment {...props} />
          </div>
        );
      },
    },
  ];
}
