import { type Descendant, Element, type Node } from 'slate';
import { jsx } from 'slate-hyperscript';
import { CustomElement, CustomText } from '../../types';
import type { IPlugin } from '../types';

export const deserialize =
  (plugins: IPlugin[]) =>
  (
    element: HTMLElement,
  ): (Descendant | string)[] | string | Descendant | null => {
    if (element.nodeType === 3) {
      return element.textContent;
    } else if (element.nodeType !== 1) {
      return null;
    } else if (element.nodeName === 'BR') {
      return '\n';
    }

    let children = Array.from(element.childNodes).flatMap((node) =>
      deserialize(plugins)(node as HTMLElement),
    );

    if (children.length === 0) {
      children = [{ text: '' }];
    }

    if (element.nodeName === 'BODY') {
      if (children.some((c) => Element.isElement(c))) {
        return jsx('fragment', {}, children);
      } else {
        return jsx('element', { type: 'paragraph' }, children);
      }
    }

    if (element.nodeName === 'P') {
      return jsx('element', { type: 'paragraph' }, children);
    }

    let result: CustomElement | CustomText[] | null = null;
    for (const plugin of plugins) {
      if (plugin.blocks?.some((b) => b.deserialize)) {
        plugin.blocks.forEach((e) => {
          if (e.deserialize) {
            const childrenAsDescendants = (result || children) as (
              | string
              | Descendant
            )[];

            const newResult = e.deserialize(element, childrenAsDescendants);
            if (newResult) {
              result = newResult;
            }
          }
        });
      }

      if (plugin.leafs?.some((b) => b.deserialize)) {
        plugin.leafs.forEach((e) => {
          if (e.deserialize) {
            const childrenAsDescendants = (result || children) as (
              | string
              | Descendant
            )[];
            const newResult = e.deserialize(element, childrenAsDescendants);
            if (newResult) {
              result = newResult;
            }
          }
        });
      }
    }

    if (result) {
      return result;
    }

    return children.filter((child) => child !== null);
  };
