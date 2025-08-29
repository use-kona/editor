import { CodeBlockPlugin, type CodeElement } from '@use-kona/editor';
import { createElement } from 'react';
import CodeBlock from './CodeBlock';

export default () =>
  new CodeBlockPlugin({
    renderCodeBlock: (value, onChange, params) => {
      return createElement(CodeBlock, {
        value,
        onChange,
        params: {
          ...params,
          element: params.element as CodeElement,
        },
      });
    },
  });
