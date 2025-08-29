import { NodeIdPlugin } from '@use-kona/editor';

export default () =>
  new NodeIdPlugin({
    generateId: () => Math.random().toString(36).substring(2, 15),
  });
