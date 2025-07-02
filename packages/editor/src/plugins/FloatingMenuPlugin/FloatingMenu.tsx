import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Editor, Range } from 'slate';
import { useFocused, useSlate, useSlateSelection } from 'slate-react';
import type { CustomElement } from '../../../types';
import styles from './styles.module.css';
import type { Options } from './types';

type Props = {
  focused?: HTMLElement | null;
  options: Options;
  isVisible?: boolean;
  onVisibilityChange?: (isVisible: boolean) => void;
};

export const FloatingMenu = (props: Props) => {
  const { options, focused, isVisible, onVisibilityChange } = props;

  const [style, setStyle] = useState<CSSProperties | undefined>(undefined);

  const ref = useRef<HTMLDivElement>(null);

  const selection = useSlateSelection();
  const editor = useSlate();
  const isFocused = useFocused();

  const onClose = () => {
    setStyle(undefined);
    options.onHide();
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: we care only about selection
  useLayoutEffect(() => {
    if (!selection) {
      return;
    }

    const entry = Editor.above<CustomElement>(editor, {
      at: selection,
      match: (n) => !Editor.isEditor(n),
      mode: 'highest',
    });

    if (
      !selection ||
      !isFocused ||
      Range.isCollapsed(selection) ||
      Editor.string(editor, selection) === '' ||
      !entry ||
      options.ignoreNodes?.includes(entry[0].type)
    ) {
      onVisibilityChange?.(options.onHide());
      return;
    }

    onVisibilityChange?.(options.onShow());
  }, [selection]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we care only about selection
  useLayoutEffect(() => {
    if (!selection) {
      return;
    }

    const entry = Editor.above<CustomElement>(editor, {
      at: selection,
      match: (n) => !Editor.isEditor(n),
      mode: 'highest',
    });

    if (
      !selection ||
      !isFocused ||
      Range.isCollapsed(selection) ||
      Editor.string(editor, selection) === '' ||
      !entry ||
      options.ignoreNodes?.includes(entry?.[0].type)
    ) {
      return;
    }

    handleUpdate();
  }, [selection]);

  const handleUpdate = () => {
    const element = ref.current;
    let rect: DOMRect | undefined;

    if (focused) {
      rect = focused.getBoundingClientRect();
    } else {
      const domSelection = window.getSelection();

      if (!domSelection || domSelection.isCollapsed) {
        return;
      }

      const domRange = domSelection?.getRangeAt(0);
      rect = domRange?.getBoundingClientRect();
    }

    setStyle({
      opacity: 1,
      transform: 'scale(1)',
      top: `${(rect?.top || 0) + window.scrollY - (element?.offsetHeight || 0)}px`,
      left: `${
        (rect?.left || 0) +
        window.scrollX -
        (element?.offsetWidth || 0) / 2 +
        (rect?.width || 0) / 2
      }px`,
    });
  };

  if (!isVisible) {
    return null;
  }

  return createPortal(
    <>
      <div
        onMouseDown={() => {
          setStyle(undefined);
        }}
      >
        {options.renderBackdrop?.({ onClose, onUpdate: handleUpdate })}
      </div>
      <div
        ref={ref}
        style={{
          ...style,
          display: 'block',
        }}
        className={styles.root}
        onMouseDown={(event) => {
          event.preventDefault();
        }}
      >
        {options.renderMenu(editor, { onClose, onUpdate: handleUpdate })}
      </div>
    </>,
    document.body,
  );
};
