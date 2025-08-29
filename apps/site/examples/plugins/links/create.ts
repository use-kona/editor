import { type FloatingMenuPlugin, LinksPlugin } from '@use-kona/editor';
import { createElement } from 'react';
import { LinksHint } from './LinksHint';

export default ({
  floatingMenuPlugin,
}: {
  floatingMenuPlugin: FloatingMenuPlugin;
}) =>
  new LinksPlugin({
    renderHint: (methods) =>
      createElement(LinksHint, { floatingMenuPlugin, methods }),
  });
