import { useEffect, useRef, useState } from 'react';
import type { Editor } from 'slate';
import {
  CommandsResolver,
  type ResolvedCommandsState,
} from './resolveCommands';
import type { Command, CommandPathEntry } from './types';

const DEBOUNCE_TIMEOUT = 150;

type Params = {
  rootCommands: Command[];
  filter: boolean | string;
  path: CommandPathEntry[];
  editor: Editor;
  isOpen: boolean;
};

const EMPTY_STATE: ResolvedCommandsState = {
  commands: [],
  isLoading: false,
  isError: false,
};

export const useResolvedCommands = (params: Params) => {
  const { rootCommands, filter, path, editor, isOpen } = params;
  const resolverRef = useRef(new CommandsResolver());
  const [state, setState] = useState<ResolvedCommandsState>(EMPTY_STATE);
  const prevIsOpenRef = useRef(false);
  const prevPathKeyRef = useRef('');
  const prevQueryRef = useRef('');
  const query = typeof filter === 'string' ? filter : '';

  useEffect(() => {
    if (!isOpen || filter === false) {
      setState(EMPTY_STATE);
      prevIsOpenRef.current = false;
      prevPathKeyRef.current = '';
      prevQueryRef.current = '';
      return;
    }

    const pathKey = path.map((item) => item.name).join('/');
    const isNewSession = !prevIsOpenRef.current;
    const isPathChanged = !isNewSession && prevPathKeyRef.current !== pathKey;
    const isQueryChanged = !isNewSession && prevQueryRef.current !== query;

    if (isNewSession || isPathChanged) {
      setState({
        commands: [],
        isLoading: true,
        isError: false,
      });
    } else if (isQueryChanged) {
      setState((state) => ({
        ...state,
        isLoading: true,
        isError: false,
      }));
    }

    prevIsOpenRef.current = true;
    prevPathKeyRef.current = pathKey;
    prevQueryRef.current = query;

    const timeout = window.setTimeout(
      () => {
        const request = resolverRef.current.resolve({
          rootCommands,
          filter: query,
          path,
          editor,
        });

        request.promise.then((resolved) => {
          setState(resolved);
        });
      },
      query ? DEBOUNCE_TIMEOUT : 0,
    );

    return () => {
      window.clearTimeout(timeout);
    };
  }, [editor, filter, isOpen, path, query, rootCommands]);

  return state;
};
