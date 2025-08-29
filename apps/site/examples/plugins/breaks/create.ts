import { BreaksPlugin, HeadingsPlugin } from '@use-kona/editor';

export default () =>
  new BreaksPlugin({
    breakNodes: [
      HeadingsPlugin.HeadingLevel1,
      HeadingsPlugin.HeadingLevel2,
      HeadingsPlugin.HeadingLevel3,
    ],
  });
