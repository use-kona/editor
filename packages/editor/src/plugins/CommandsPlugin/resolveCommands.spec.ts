import type { Editor } from 'slate';
import { describe, expect, it } from 'vitest';
import { CommandsResolver } from './resolveCommands';
import type { Command } from './types';

const editor = {} as Editor;

const leaf = (params: {
  name: string;
  title: string;
  commandName?: string;
}): Command => ({
  name: params.name,
  title: params.title,
  commandName: params.commandName ?? params.title.toLocaleLowerCase(),
  icon: null,
  action: () => {},
});

const deferred = <T>() => {
  let resolve: (value: T) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

describe('CommandsResolver', () => {
  it('keeps leaf-only legacy behavior', async () => {
    const resolver = new CommandsResolver();
    const rootCommands: Command[] = [
      leaf({ name: 'paragraph', title: 'Paragraph' }),
      leaf({ name: 'code', title: 'Code' }),
    ];

    const request = resolver.resolve({
      rootCommands,
      filter: '',
      path: [],
      editor,
    });

    const result = await request.promise;

    expect(result.commands.map((item) => item.command.name)).toEqual([
      'paragraph',
      'code',
    ]);
  });

  it('resolves static submenu with sync getCommands', async () => {
    const resolver = new CommandsResolver();
    const rootCommands: Command[] = [
      {
        name: 'insert',
        title: 'Insert',
        commandName: 'insert',
        icon: null,
        getCommands: () => [leaf({ name: 'heading-1', title: 'Heading 1' })],
      },
    ];

    const request = resolver.resolve({
      rootCommands,
      filter: '',
      path: [{ name: 'insert', title: 'Insert', commandName: 'insert' }],
      editor,
    });

    const result = await request.promise;

    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]?.command.name).toBe('heading-1');
  });

  it('resolves async submenu', async () => {
    const resolver = new CommandsResolver();
    const rootCommands: Command[] = [
      {
        name: 'remote',
        title: 'Remote',
        commandName: 'remote',
        icon: null,
        getCommands: async () => [leaf({ name: 'code', title: 'Code' })],
      },
    ];

    const request = resolver.resolve({
      rootCommands,
      filter: '',
      path: [{ name: 'remote', title: 'Remote', commandName: 'remote' }],
      editor,
    });

    const result = await request.promise;

    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]?.command.name).toBe('code');
  });

  it('returns global leaf query matches with breadcrumbs', async () => {
    const resolver = new CommandsResolver();
    const rootCommands: Command[] = [
      {
        name: 'insert',
        title: 'Insert',
        commandName: 'insert',
        icon: null,
        getCommands: () => [
          leaf({
            name: 'heading-1',
            title: 'Heading 1',
            commandName: 'heading1',
          }),
          leaf({ name: 'code', title: 'Code', commandName: 'code' }),
        ],
      },
    ];

    const request = resolver.resolve({
      rootCommands,
      filter: 'code',
      path: [],
      editor,
    });

    const result = await request.promise;

    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]?.command.name).toBe('code');
    expect(result.commands[0]?.breadcrumb).toBe('Insert');
  });

  it('returns matching submenu commands in query mode', async () => {
    const resolver = new CommandsResolver();
    const rootCommands: Command[] = [
      {
        name: 'advanced',
        title: 'Advanced',
        commandName: 'advanced',
        icon: null,
        getCommands: () => [leaf({ name: 'code', title: 'Code' })],
      },
    ];

    const request = resolver.resolve({
      rootCommands,
      filter: 'adv',
      path: [],
      editor,
    });

    const result = await request.promise;

    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]?.command.name).toBe('advanced');
    expect(result.commands[0]?.isSubmenu).toBe(true);
  });

  it('ignores stale out-of-order async responses', async () => {
    const resolver = new CommandsResolver();
    const searchA = deferred<Command[]>();
    const searchB = deferred<Command[]>();

    const rootCommands: Command[] = [
      {
        name: 'remote',
        title: 'Remote',
        commandName: 'remote',
        icon: null,
        getCommands: ({ query }) => {
          if (query === 'a') {
            return searchA.promise;
          }

          return searchB.promise;
        },
      },
    ];

    const firstRequest = resolver.resolve({
      rootCommands,
      filter: 'a',
      path: [],
      editor,
    });
    const secondRequest = resolver.resolve({
      rootCommands,
      filter: 'b',
      path: [],
      editor,
    });

    searchB.resolve([leaf({ name: 'b', title: 'Result B', commandName: 'b' })]);
    const secondResult = await secondRequest.promise;

    expect(secondResult.commands.map((item) => item.command.name)).toEqual([
      'b',
    ]);

    searchA.resolve([leaf({ name: 'a', title: 'Result A', commandName: 'a' })]);
    const firstResult = await firstRequest.promise;

    expect(firstResult.commands.map((item) => item.command.name)).toEqual([
      'b',
    ]);
    expect(
      resolver.getState().commands.map((item) => item.command.name),
    ).toEqual(['b']);
  });

  it('clears visible commands while loading new results', async () => {
    const resolver = new CommandsResolver();
    const remoteDeferred = deferred<Command[]>();
    const rootCommands: Command[] = [
      leaf({ name: 'paragraph', title: 'Paragraph' }),
      {
        name: 'remote',
        title: 'Remote',
        commandName: 'remote',
        icon: null,
        getCommands: ({ query }) => {
          if (query) {
            return remoteDeferred.promise;
          }

          return [leaf({ name: 'code', title: 'Code' })];
        },
      },
    ];

    const initial = await resolver.resolve({
      rootCommands,
      filter: '',
      path: [],
      editor,
    }).promise;

    const loadingRequest = resolver.resolve({
      rootCommands,
      filter: 'code',
      path: [],
      editor,
    });

    expect(loadingRequest.state.isLoading).toBe(true);
    expect(initial.commands.length).toBeGreaterThan(0);
    expect(loadingRequest.state.commands).toEqual([]);

    remoteDeferred.resolve([leaf({ name: 'code', title: 'Code' })]);
    const settled = await loadingRequest.promise;

    expect(settled.isLoading).toBe(false);
    expect(settled.commands).toHaveLength(1);
    expect(settled.commands[0]?.command.name).toBe('code');
  });
});
