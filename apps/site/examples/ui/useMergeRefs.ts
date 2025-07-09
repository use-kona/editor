import { useMemo } from 'react';

/**
 * Merges multiple React refs into a single ref callback.
 *
 * @template T The type of the ref value
 * @param {React.Ref<T>[]} refs Array of refs to merge (can be both callback refs and object refs)
 * @returns {React.RefCallback<T> | null} A merged ref callback or null if all input refs are null
 *
 * @example
 * function Component() {
 *   const firstRef = useRef<HTMLDivElement>(null)
 *   const secondRef = useRef<HTMLDivElement>(null)
 *   const forwardedRef = useForwardedRef<HTMLDivElement>(null)
 *
 *   const mergedRef = useMergeRefs([firstRef, secondRef, forwardedRef])
 *
 *   return (
 *     <div ref={mergedRef}>
 *       This div will be referenced by all three refs
 *     </div>
 *   )
 * }
 */
export const useMergeRefs = <T>(refs: React.Ref<T>[]) =>
  useMemo(() => {
    if (refs.every((ref) => ref == null)) {
      return null;
    }
    return (refValue: T) => {
      refs.forEach((ref) => {
        if (typeof ref === 'function') {
          ref(refValue);
        } else if (ref != null) {
          (ref as React.MutableRefObject<T | null>).current = refValue;
        }
      });
    };
  }, []);
