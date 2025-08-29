import { useReadOnly, useSlate } from 'slate-react';
import type { Options } from './types';

export const Menu = (props: Options) => {
  const editor = useSlate();
  const readOnly = useReadOnly();

  return <>{props.renderMenu({ editor, readOnly, children: null })}</>;
};
