import type { Editor } from 'slate';
import type { RenderElementProps } from 'slate-react';
import type { ReactNode } from 'react';

export type Options = {
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  onPaste?: (editor: Editor, file: File) => void;
  onDelete?: (editor: Editor, fileId?: string) => void;
  onDownload?: (fileId: string) => void;
  Attachment: (props: RenderElementProps) => ReactNode;
};
