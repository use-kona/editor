import React, { useLayoutEffect, useRef, useState } from 'react';
import { RenderElementProps, useSlateStatic } from 'slate-react';
import styles from './styles.module.css';
import { createPortal } from 'react-dom';
import { LinkElement, Options } from './types';

type Props = {
  as?: React.ElementType;
  renderHint: Options['renderHint'];
} & RenderElementProps & {
    element: LinkElement;
  };

export const Link = (props: Props) => {
  const editor = useSlateStatic();
  const { attributes, as: Component = 'span', children, element, renderHint } = props;
  const [isOpen, setOpen] = useState(false);
  const [style, setStyle] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setOpen(true);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setOpen(false);
  };

  useLayoutEffect(() => {
    if (isOpen) {
      const rect = ref.current?.getBoundingClientRect();
      if (rect) {
        const top = rect.top + rect.height + window.scrollY;
        const left = rect.left + window.scrollX;

        setStyle({ top, left });
      }
    }
  }, [isOpen]);

  const getLinkElement = () => element;

  const getUrl = () => element.url;

  const getEditor = () => editor;

  return (
    <Component ref={ref} className={styles.link} contentEditable={false}>
      <a
        {...attributes}
        onClick={handleLinkClick}
        href={element.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <InlineChromiumBugfix />
        {children}
        <InlineChromiumBugfix />
      </a>
      {isOpen &&
        createPortal(
          <>
            <div className={styles.backdrop} onClick={() => setOpen(false)} />
            <div
              contentEditable={false}
              className={styles.hint}
              style={style}
              onMouseUp={handleMenuClick}
            >
              {renderHint({
                getLinkElement,
                getUrl,
                getEditor,
              })}
            </div>
          </>,
          document.body,
        )}
    </Component>
  );
};

const InlineChromiumBugfix = () => {
  return (
    <span style={{ fontSize: 0 }} contentEditable={false}>
      ${String.fromCodePoint(160)}
    </span>
  );
};
