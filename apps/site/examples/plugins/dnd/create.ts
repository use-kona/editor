import { createElement } from 'react';
import { CodeBlockPlugin, DnDPlugin, ListsPlugin } from '@use-kona/editor';

import DragBlock from './DragBlock';

export default () =>
  new DnDPlugin({
    renderBlock: (params) => {
      return createElement(DragBlock, params);
    },
    onDropFiles: () => {},
    ignoreNodes: [
      CodeBlockPlugin.CODE_LINE_ELEMENT,
      ListsPlugin.BULLETED_LIST_ELEMENT,
      ListsPlugin.NUMBERED_LIST_ELEMENT,
    ],
  });
