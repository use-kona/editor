import {
  CodeBlockPlugin,
  CommandsPlugin,
  type ListsPlugin,
} from '@use-kona/editor';
import { getCommands } from '../../utils';
import { createElement } from 'react';

export default ({ listsPlugin }: { listsPlugin: ListsPlugin }) =>
  new CommandsPlugin({
    commands: getCommands({ listsPlugin }),
    renderMenu: (children) => {
      return createElement('div', {}, children);
    },
    ignoreNodes: [CodeBlockPlugin.CODE_LINE_ELEMENT],
  });
