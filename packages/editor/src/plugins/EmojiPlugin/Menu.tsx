import {
  type CSSProperties,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useFocused, useSlateSelection } from 'slate-react';
import styles from './styles.module.css';

type Props = {
  isOpen: boolean;
  children: ReactNode;
  portalTarget?: Element | null;
};

export const Menu = (props: Props) => {
  const { isOpen, children, portalTarget } = props;

  const isFocused = useFocused();
  const selection = useSlateSelection();
  const ref = useRef<HTMLDivElement>(null);

  const [style, setStyle] = useState<CSSProperties | undefined>({});

  useLayoutEffect(() => {
    if (!selection || !isFocused) {
      setStyle({ opacity: 0 });
      return;
    }

    setTimeout(() => {
      const domSelection = window.getSelection();
      const domRange = domSelection?.getRangeAt(0);
      const rect = domRange?.getBoundingClientRect();

      if (isOpen) {
        setStyle({
          opacity: 1,
          transform: 'scale(1)',
          top: `${(rect?.top || 0) + window.scrollY + (rect?.height || 0) + 2}px`,
          left: `${(rect?.left || 0) + window.scrollX + (rect?.width || 0) / 2}px`,
        });
      } else {
        setStyle({
          opacity: 0,
          transform: 'scale(0.9)',
        });
      }
    }, 0);
  }, [selection, isFocused, isOpen]);

  useLayoutEffect(() => {
    const element = ref.current;
    if (element) {
      const { height, top } = element.getBoundingClientRect();

      const domSelection = window.getSelection();
      const domRange = domSelection?.getRangeAt(0);
      const rect = domRange?.getBoundingClientRect();

      if (top + height >= window.innerHeight) {
        setStyle((style) => ({
          ...style,
          top: `${top - height - (rect?.height ?? 22)}px`,
        }));
      }
    }
  }, []);

  return createPortal(
    <div ref={ref} style={style} className={styles.root}>
      {children}
    </div>,
    portalTarget || document.body,
  );
};
