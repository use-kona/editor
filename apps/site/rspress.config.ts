import * as path from 'node:path';
import {defineConfig} from 'rspress/config';
import {pluginFontOpenSans} from 'rspress-plugin-font-open-sans';


const packagesDir = path.resolve(__dirname, '../../packages');

console.log(path.resolve(packagesDir, 'editor'));

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'Kona Editor',
  plugins: [
    pluginFontOpenSans()
  ],
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
            }
          ]
        }
      ],
    },
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/web-infra-dev/rspress',
      },
    ],
  },
});
