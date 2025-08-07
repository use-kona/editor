import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import {type Descendant, Editor, type NodeMatch, Transforms} from 'slate';
import { ReactEditor, Slate } from 'slate-react';
import type { CustomElement } from '../types';
import { createEditable } from './core/createEditable';
import { createEditor } from './core/createEditor';
import { deserialize } from './core/deserialize';
import { serialize } from './core/serialize';
import type { EditorRef, IPlugin } from './types';
import { isEmpty } from './utils';

type KonaEditorProps = {
  readOnly?: boolean;
  plugins?: IPlugin[];
  initialValue: Descendant[];
  onChange: (value: Descendant[]) => void;
};

export const KonaEditor = forwardRef<EditorRef, KonaEditorProps>(
  (props, ref) => {
    const { initialValue, plugins = [], readOnly = false, onChange } = props;

    const [editor] = useState(createEditor(plugins));

    const SlateEditable = useCallback(createEditable(editor, plugins), []);

    useImperativeHandle(ref, () => {
      const deleteNode = (match: NodeMatch<CustomElement>) => {
        Transforms.removeNodes(editor, { at: [], match });
      };

      return {
        serialize: serialize(plugins),
        deserialize: deserialize(plugins),
        deleteNode,
        isEmpty: () => {
          return isEmpty(editor.children);
        },
        focus: (mode?: 'end') => {
          if (mode === 'end') {
            const endPoint = Editor.end(editor, [])
            Transforms.select(editor, endPoint)
          }

          ReactEditor.focus(editor);
        },
      };
    }, [editor, plugins]);

    return (
      <Slate
        editor={editor}
        initialValue={initialValue}
        onValueChange={onChange}
      >
        <SlateEditable readOnly={readOnly} />
      </Slate>
    );
  },
);
