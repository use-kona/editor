import { CodeBlockPlugin, PlaceholderPlugin } from '@use-kona/editor';

export default () =>
  new PlaceholderPlugin({
    focused: 'Write / to open command menu',
    unfocused: 'Write / to open command menu',
    ignoreNodes: [CodeBlockPlugin.CODE_LINE_ELEMENT],
  });
