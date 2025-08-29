import type { Editor } from 'slate';
import {
  CodeBlockPlugin,
  type Commands,
  FloatingMenuPlugin,
} from '@use-kona/editor';
import FloatingMenu from './FloatingMenu';
import { $store } from '../../store';
import { createElement } from 'react';

export default () =>
  new FloatingMenuPlugin({
    ignoreNodes: [CodeBlockPlugin.CODE_ELEMENT],
    renderMenu: (editor: Editor, commands: Commands) => {
      return createElement(FloatingMenu, {
        $store,
        editor,
        commands,
      });
    },
    onShow: () => {
      $store.setKey('isFloatingMenuOpen', true);
      return true;
    },
    onHide: () => {
      if ($store.get().floatingMenuMode === 'main') {
        $store.setKey('isFloatingMenuOpen', false);
        $store.setKey('url', undefined);
        return false;
      }

      return true;
    },
  });
