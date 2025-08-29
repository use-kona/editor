import { CodeBlockPlugin, ShortcutsPlugin } from '@use-kona/editor';
import { getShortcuts } from '../../utils';

export default () =>
  new ShortcutsPlugin({
    shortcuts: getShortcuts(),
    ignoreNodes: [
      CodeBlockPlugin.CODE_ELEMENT,
      CodeBlockPlugin.CODE_LINE_ELEMENT,
    ],
  });
