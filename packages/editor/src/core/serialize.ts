import escapeHtml from 'escape-html';
import { Text } from 'slate';
import type { CustomElement, CustomText } from '../../types';
import type { IPlugin } from '../types';

export const serialize =
  (plugins: IPlugin[]) =>
  (node: CustomElement | CustomText): string => {
    const serializers = plugins
      .flatMap((plugin) => plugin.blocks?.map((element) => element.serialize))
      .concat(
        plugins.flatMap((plugin) =>
          plugin.leafs?.map((element) => element.serialize),
        ),
      )
      .filter(Boolean);

    if (Array.isArray(node)) {
      return node.map(serialize(plugins)).join('');
    }

    if (Text.isText(node)) {
      return serializers.reduce((prev, current) => {
        return current?.(node) || prev;
      }, escapeHtml(node.text));
    } else {
      const children: string = node?.children
        ?.map((n) => serialize(plugins)(n))
        .join('');

      if (node?.type === 'paragraph') {
        return `<p>${children}</p>`;
      }

      return (
        serializers.reduce((prev, current) => {
          return current?.(node, children) || prev;
        }, '') || children
      );
    }
  };
