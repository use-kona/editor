import * as path from 'node:path';
import { defineConfig } from 'rspress/config';
import { pluginFontOpenSans } from 'rspress-plugin-font-open-sans';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'Kona Editor',
  base: '/editor/',
  icon: '/kona.svg',
  logo: '/kona.svg',
  logoText: 'Kona Editor',
  head: [
    '<script defer src="https://umami.kona.to/script.js" data-website-id="428b0290-b2dc-4810-8f84-d49d19d710ff"></script>',
  ],
  plugins: [pluginFontOpenSans()],
  themeConfig: {
    nav: [
      {
        text: 'Home',
        link: '/',
      },
      {
        text: 'Guide',
        link: '/guide/',
      },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          link: '/guide/',
        },
        {
          text: 'Writing a plugin',
          link: '/guide/writing-a-plugin',
        },
        {
          text: 'Plugins',
          link: '/guide/plugins',
          items: [
            {
              text: 'BasicFormattingPlugin',
              link: '/guide/plugins/basic-formatting-plugin',
            },
            {
              text: 'BreaksPlugin',
              link: '/guide/plugins/breaks-plugin',
            },
            {
              text: 'CodeBlockPlugin',
              link: '/guide/plugins/code-block-plugin',
            },
            {
              text: 'CommandsPlugin',
              link: '/guide/plugins/commands-plugin',
            },
            {
              text: 'DnDPlugin',
              link: '/guide/plugins/dnd-plugin',
            },
            {
              text: 'FloatingMenuPlugin',
              link: '/guide/plugins/floating-menu-plugin',
            },
            {
              text: 'HeadingsPlugin',
              link: '/guide/plugins/headings-plugin',
            },
            {
              text: 'HighlightsPlugin',
              link: '/guide/plugins/highlights-plugin',
            },
            {
              text: 'LinksPlugin',
              link: '/guide/plugins/links-plugin',
            },
            {
              text: 'ListsPlugin',
              link: '/guide/plugins/lists-plugin',
            },
            {
              text: 'MenuPlugin',
              link: '/guide/plugins/menu-plugin',
            },
            {
              text: 'NodeIdPlugin',
              link: '/guide/plugins/node-id-plugin',
            },
            {
              text: 'PlaceholderPlugin',
              link: '/guide/plugins/placeholder-plugin',
            },
            {
              text: 'ShortcutsPlugin',
              link: '/guide/plugins/shortcuts-plugin',
            },
            {
              text: 'TableOfContentsPlugin',
              link: '/guide/plugins/table-of-contents-plugin',
            },
            {
              text: 'EmojiPlugin',
              link: '/guide/plugins/emoji-plugin',
            },
          ],
        },
      ],
    },
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/use-kona/editor',
      },
    ],
  },
});
