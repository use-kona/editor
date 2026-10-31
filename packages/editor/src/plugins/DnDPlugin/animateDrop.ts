import type { Editor } from 'slate';
import { ReactEditor } from 'slate-react';

const selector = '[data-editor-dnd-block]';
const animations = new WeakMap<HTMLElement, Animation>();
const frames = new WeakMap<HTMLElement, number>();

/** Animate the layout change only for a drop, never for typing or selection. */
export const animateDrop = (editor: Editor, move: () => void) => {
  const root = ReactEditor.toDOMNode(editor, editor);
  const window = root.ownerDocument.defaultView;
  if (
    !window ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
    typeof root.animate !== 'function'
  ) {
    move();
    return;
  }

  const frame = frames.get(root);
  if (frame !== undefined) window.cancelAnimationFrame(frame);

  const elements = Array.from(root.querySelectorAll<HTMLElement>(selector));
  const before = new Map(
    elements.map((element) => [
      element.dataset.editorDndBlock ?? '',
      element.getBoundingClientRect(),
    ]),
  );
  // Read the current visual positions before cancelling an interrupted drop.
  for (const element of elements) {
    animations.get(element)?.cancel();
    animations.delete(element);
  }

  move();

  // Slate notifies React in a microtask. Measure the committed DOM on the next
  // frame, before paint, rather than measuring immediately after the transform.
  frames.set(
    root,
    window.requestAnimationFrame(() => {
      frames.delete(root);
      if (!root.isConnected) return;
      animateLayout(root, before);
    }),
  );
};

const animateLayout = (root: HTMLElement, before: Map<string, DOMRect>) => {
  const offsets = new Map<HTMLElement, { x: number; y: number }>();
  for (const element of Array.from(
    root.querySelectorAll<HTMLElement>(selector),
  )) {
    const previous = before.get(element.dataset.editorDndBlock ?? '');
    const next = element.getBoundingClientRect();
    if (
      !previous ||
      !previous.width ||
      !previous.height ||
      !next.width ||
      !next.height
    )
      continue;
    offsets.set(element, {
      x: previous.left - next.left,
      y: previous.top - next.top,
    });
  }

  for (const [element, offset] of offsets) {
    const parent = element.parentElement?.closest<HTMLElement>(selector);
    const parentOffset = parent && offsets.get(parent);
    // Nested blocks inherit their parent's motion; animate only the remainder.
    const x = offset.x - (parentOffset?.x ?? 0);
    const y = offset.y - (parentOffset?.y ?? 0);
    if (!x && !y) continue;
    const animation = element.animate(
      [{ transform: `translate(${x}px, ${y}px)` }, { transform: 'none' }],
      { duration: 180, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
    );
    animations.set(element, animation);
    const cleanup = () => {
      if (animations.get(element) === animation) animations.delete(element);
    };
    animation.onfinish = cleanup;
    animation.oncancel = cleanup;
  }
};
