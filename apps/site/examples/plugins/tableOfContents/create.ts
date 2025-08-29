import { HeadingsPlugin, TableOfContentsPlugin } from '@use-kona/editor';

export default () =>
  new TableOfContentsPlugin({
    levels: {
      [HeadingsPlugin.HeadingLevel1]: 1,
      [HeadingsPlugin.HeadingLevel2]: 2,
      [HeadingsPlugin.HeadingLevel3]: 3,
    },
  });
