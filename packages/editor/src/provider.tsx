import type { StoreValue } from 'nanostores';
import type React from 'react';
import { createContext, useContext } from 'react';
import type { EditorContext } from './types';

const Context = createContext<EditorContext | null>(null);

export const EditorProvider = ({
  children,
  selectedNodes,
}: {
  children: React.ReactNode;
  selectedNodes: StoreValue<string[]>;
}) => {
  return (
    <Context.Provider value={{ selectedNodes }}>{children}</Context.Provider>
  );
};

export const useEditorContext = () => {
  const context = useContext(Context);

  if (!context) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }

  return context;
};
