import type { Editor } from 'slate';
import type { Command, CommandPathEntry } from './types';

type ResolveChildCommandsParams = {
  command: Command;
  path: CommandPathEntry[];
  query: string;
  editor: Editor;
};

type ResolveChildCommands = (
  params: ResolveChildCommandsParams,
) => Promise<Command[]>;

export type ResolvedCommand = {
  command: Command;
  key: string;
  path: CommandPathEntry[];
  isSubmenu: boolean;
};

export type ResolveCommandsParams = {
  rootCommands: Command[];
  filter: string;
  path: CommandPathEntry[];
  editor: Editor;
};

export type ResolvedCommandsState = {
  commands: ResolvedCommand[];
  isLoading: boolean;
  isError: boolean;
};

type ResolveRequest = {
  state: ResolvedCommandsState;
  promise: Promise<ResolvedCommandsState>;
};

type CacheEntry =
  | {
      status: 'pending';
      promise: Promise<Command[]>;
    }
  | {
      status: 'resolved';
      value: Command[];
    }
  | {
      status: 'rejected';
      error: unknown;
    };

const toPathEntry = (command: Command): CommandPathEntry => ({
  name: command.name,
  title: command.title,
  commandName: command.commandName,
});

const pathToKey = (path: CommandPathEntry[]) =>
  path.map((item) => item.name).join('/');

const normalizeCommands = (commands: Command[] | undefined | null) => {
  return Array.isArray(commands) ? commands : [];
};

const isCommandMatchesQuery = (command: Command, query: string) => {
  const normalized = query.toLocaleLowerCase();

  return (
    command.commandName.toLocaleLowerCase().includes(normalized) ||
    command.title.toLocaleLowerCase().includes(normalized)
  );
};

const toResolvedCommand = (
  command: Command,
  parentPath: CommandPathEntry[],
): ResolvedCommand => {
  const path = [...parentPath, toPathEntry(command)];

  return {
    command,
    path,
    key: pathToKey(path),
    isSubmenu: Boolean(command.getCommands),
  };
};

const resolveCurrentLevelCommands = async (
  params: ResolveCommandsParams,
  resolveChildCommands: ResolveChildCommands,
  queryForCurrentLevel: string,
) => {
  const { rootCommands, path, editor } = params;
  let currentCommands = rootCommands;
  let currentPath: CommandPathEntry[] = [];

  for (let index = 0; index < path.length; index++) {
    const item = path[index];
    const isLastPathItem = index === path.length - 1;
    const command = currentCommands.find((entry) => entry.name === item.name);
    if (!command?.getCommands) {
      return {
        commands: [],
        path: currentPath,
      };
    }

    currentPath = [...currentPath, toPathEntry(command)];
    currentCommands = await resolveChildCommands({
      command,
      path: currentPath,
      query: isLastPathItem ? queryForCurrentLevel : '',
      editor,
    });
  }

  return {
    commands: currentCommands,
    path: currentPath,
  };
};

const resolveBrowseCommands = async (
  params: ResolveCommandsParams,
  resolveChildCommands: ResolveChildCommands,
) => {
  const currentLevel = await resolveCurrentLevelCommands(
    params,
    resolveChildCommands,
    '',
  );

  return currentLevel.commands.map((command) =>
    toResolvedCommand(command, currentLevel.path),
  );
};

const resolveSearchCommands = async (
  params: ResolveCommandsParams,
  resolveChildCommands: ResolveChildCommands,
) => {
  const { filter } = params;
  const currentLevel = await resolveCurrentLevelCommands(
    params,
    resolveChildCommands,
    filter,
  );

  const matchedCommands = currentLevel.commands.filter((command) =>
    isCommandMatchesQuery(command, filter),
  );

  return matchedCommands.map((command) =>
    toResolvedCommand(command, currentLevel.path),
  );
};

export class CommandsResolver {
  private cache = new Map<string, CacheEntry>();
  private requestId = 0;
  private state: ResolvedCommandsState = {
    commands: [],
    isLoading: false,
    isError: false,
  };

  getState() {
    return this.state;
  }

  resolve(params: ResolveCommandsParams): ResolveRequest {
    const currentRequestId = ++this.requestId;
    this.state = {
      commands: [],
      isLoading: true,
      isError: false,
    };

    const promise = this.resolveInternal(params)
      .then((commands) => {
        if (currentRequestId !== this.requestId) {
          return this.state;
        }

        this.state = {
          commands,
          isLoading: false,
          isError: false,
        };

        return this.state;
      })
      .catch(() => {
        if (currentRequestId !== this.requestId) {
          return this.state;
        }

        this.state = {
          ...this.state,
          isLoading: false,
          isError: true,
        };

        return this.state;
      });

    return {
      state: this.state,
      promise,
    };
  }

  private resolveChildCommands: ResolveChildCommands = async (params) => {
    const { command, path, query, editor } = params;
    if (!command.getCommands) {
      return [];
    }

    const cacheKey = `${query}::${pathToKey(path)}`;
    const cached = this.cache.get(cacheKey);

    if (cached?.status === 'resolved') {
      return cached.value;
    }

    if (cached?.status === 'rejected') {
      throw cached.error;
    }

    if (cached?.status === 'pending') {
      return cached.promise;
    }

    const promise = Promise.resolve(
      command.getCommands({
        query,
        editor,
        path,
        parent: command,
      }),
    ).then((commands) => normalizeCommands(commands));

    this.cache.set(cacheKey, {
      status: 'pending',
      promise,
    });

    try {
      const commands = await promise;
      this.cache.set(cacheKey, {
        status: 'resolved',
        value: commands,
      });

      return commands;
    } catch (error) {
      this.cache.set(cacheKey, {
        status: 'rejected',
        error,
      });

      throw error;
    }
  };

  private async resolveInternal(params: ResolveCommandsParams) {
    const { filter } = params;

    if (!filter) {
      return resolveBrowseCommands(params, this.resolveChildCommands);
    }

    return resolveSearchCommands(params, this.resolveChildCommands);
  }
}
