import * as path from 'node:path';
import { defineConfig } from 'rspress/config';
import { pluginFontOpenSans } from 'rspress-plugin-font-open-sans';


const packagesDir = path.resolve(__dirname, '../../packages');

console.log(path.resolve(packagesDir, 'editor'));

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'Kona Editor',
  plugins: [
    pluginFontOpenSans()
  ],
  // builderConfig: {
  //   source: {
  //     include: [
  //       {
  //         and: [path.resolve(packagesDir, 'editor'), { not: /[\\/]node_modules[\\/]/ }]
  //       }
  //     ]
  //   }
  // },
  // icon: '/rspress-icon.png',
  // logo: {
  //   light: '/rspress-light-logo.png',
  //   dark: '/rspress-dark-logo.png',
  // },
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/web-infra-dev/rspress',
      },
    ],
  },
});
