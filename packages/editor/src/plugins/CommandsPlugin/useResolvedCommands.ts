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
  const query = typeof filter === 'string' ? filter : '';

  useEffect(() => {
    if (!isOpen || filter === false) {
      setState(EMPTY_STATE);
      return;
    }

    setState({
      commands: [],
      isLoading: true,
      isError: false,
    });

    const timeout = window.setTimeout(
      () => {
        const request = resolverRef.current.resolve({
          rootCommands,
          filter: query,
          path,
          editor,
        });

        setState(request.state);

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
