import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { CustomElement } from '../../types';
import { KonaEditor } from '../editor';
import styles from './Editor.module.css';
import { getPlugins } from './getPlugins';
import { text } from './text';

const initialValue = text;

export const ExampleEditor = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className={[styles.root].join(' ')}>
        <KonaEditor
          initialValue={initialValue as CustomElement[]}
          plugins={getPlugins()}
          onChange={console.log}
        />
      </div>
    </DndProvider>
  );
};
