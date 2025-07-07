import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { Descendant } from 'slate';
import type { CustomElement } from '../../types';
import { deserialize } from '../core/deserialize';
import { serialize } from '../core/serialize';
import { KonaEditor } from '../editor';
import type { EditorRef } from '../types';
import styles from './Editor.module.css';
import { getPlugins } from './getPlugins';
import { text } from './text';

const initialValue = text;

type Props = {
  initialValueType?: 'kona-editor' | 'html';
  value?: any;
  onChange?: (value: Descendant[]) => void;
};

export const ExampleEditor = forwardRef((props: Props, ref) => {
  const { value: defaultValue = text, initialValueType = 'kona-editor' } =
    props;
  const [plugins] = useState(getPlugins());
  const [value, setValue] = useState<Descendant[] | null>(null);

  const editorRef = useRef<EditorRef>(null);

  useImperativeHandle(
    ref,
    () => ({
      serialize: serialize(plugins),
    }),
    [plugins],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: only on init
  useEffect(() => {
    if (initialValueType === 'kona-editor') {
      setValue(defaultValue);
    } else {
      const parsed = deserialize(plugins)(defaultValue);
      parsed && setValue(parsed as Descendant[]);
    }
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={[styles.root].join(' ')}>
        {value && (
          <KonaEditor
            ref={editorRef}
            initialValue={value || (initialValue as CustomElement[])}
            plugins={plugins}
            onChange={props.onChange || console.log}
          />
        )}
      </div>
    </DndProvider>
  );
});
