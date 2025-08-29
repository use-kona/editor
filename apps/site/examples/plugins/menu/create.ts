import { createElement } from 'react';
import { type ListsPlugin, MenuPlugin } from '@use-kona/editor';

import Menu from './Menu';

export default ({ listsPlugin }: { listsPlugin: ListsPlugin }) =>
  new MenuPlugin({
    renderMenu: ({ editor }) => {
      return createElement(Menu, { editor, listsPlugin });
    },
  });
