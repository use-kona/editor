import { useStore } from '@nanostores/react';
import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { useEditorContext } from '../provider';
import styles from './styles.module.css';

type Highlight = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export const EditorSurface = ({ children }: { children: ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedNodes } = useEditorContext();
  const selection = useStore(selectedNodes);
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const editable = container?.querySelector<HTMLElement>(
      '[data-slate-editor]',
    );
    if (!container || !editable || selection.length === 0) {
      setHighlights([]);
      return;
    }

    let frame: number | undefined;
    const observed = new Set<Element>();
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(() => scheduleMeasure());

    const measure = () => {
      const origin = container.getBoundingClientRect();
      const next: Highlight[] = [];
      let group: Highlight | undefined;
      const blocks = Array.from(editable.children);

      for (const block of blocks) {
        const isBlock = block.hasAttribute('data-editor-block');
        const isSelected =
          isBlock &&
          (block.querySelector('[data-editor-block][data-editor-selected]') ||
            (block.hasAttribute('data-editor-selected') &&
              !block.querySelector('[data-editor-block]')));
        const rect = block.getBoundingClientRect();

        // A nested selection highlights its top-level block, as before.
        // Empty/collapsed blocks have no visible area to highlight.
        if (!isSelected || rect.width === 0 || rect.height === 0) {
          group = undefined;
          continue;
        }

        const top =
          rect.top - origin.top + container.scrollTop - container.clientTop;
        const left =
          rect.left - origin.left + container.scrollLeft - container.clientLeft;
        if (group) {
          const right = Math.max(group.left + group.width, left + rect.width);
          group.left = Math.min(group.left, left);
          group.width = right - group.left;
          group.height = top + rect.height - group.top;
        } else {
          group = { top, left, width: rect.width, height: rect.height };
          next.push(group);
        }
      }

      setHighlights((previous) =>
        previous.length === next.length &&
        previous.every(
          (rect, index) =>
            rect.top === next[index].top &&
            rect.left === next[index].left &&
            rect.width === next[index].width &&
            rect.height === next[index].height,
        )
          ? previous
          : next,
      );

      // Watch every top-level block: resizing an unselected predecessor also
      // moves the selection. Refresh the targets when Slate adds/removes blocks.
      const targets = new Set<Element>([container, editable, ...blocks]);
      for (const target of observed) {
        if (!targets.has(target)) {
          resizeObserver?.unobserve(target);
          observed.delete(target);
        }
      }
      for (const target of targets) {
        if (!observed.has(target)) {
          resizeObserver?.observe(target);
          observed.add(target);
        }
      }
    };

    function scheduleMeasure() {
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => {
        frame = undefined;
        measure();
      });
    }

    measure();
    const mutationObserver = new MutationObserver(scheduleMeasure);
    mutationObserver.observe(editable, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
    container.addEventListener('scroll', scheduleMeasure, true);
    window.addEventListener('resize', scheduleMeasure);

    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
      container.removeEventListener('scroll', scheduleMeasure, true);
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [selection]);

  return (
    <div className={styles.editor} ref={containerRef}>
      <div
        className={styles.selectionLayer}
        aria-hidden="true"
        contentEditable={false}
      >
        {highlights.map((rect, index) => (
          <div
            key={index}
            className={styles.selectionHighlight}
            style={{
              transform: `translate(${rect.left}px, ${rect.top}px)`,
              width: rect.width,
              height: rect.height,
            }}
          />
        ))}
      </div>
      {children}
    </div>
  );
};
