import { useEffect, useState } from 'react';

type Props = {
  debug?: boolean;
  rect?: DOMRect;
};

export const SafeSpace = (props: Props) => {
  const { rect, debug } = props;

  const { x = 0, y = 0, height: h = 0, width: w = 0 } = rect || {};

  const [mouseX, mouseY] = useMousePosition();

  const isReversed = mouseX > x + w;
  const width = isReversed ? mouseX - x - w : x - mouseX;
  const height = h;

  const style = {
    width,
    height: h,
    top: y,
    left: isReversed ? x + w : mouseX,
  };

  const points = isReversed
    ? `0,0 ${width + 10},${mouseY - y} 0,${height}`
    : `0,${mouseY - y} ${width},0 ${width},${height}`;

  return (
    <svg
      style={{
        ...style,
        pointerEvents: 'none',
        zIndex: 20,
        position: 'fixed',
      }}
    >
      {/* Safe Area */}
      <polygon
        points={points}
        fill={debug ? 'rgba(0,0,0,0.25)' : 'transparent'}
        pointerEvents="all"
      />
    </svg>
  );
};

const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState([0, 0]);

  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      setMousePosition([ev.clientX, ev.clientY]);
    };

    const throttledUpdateMousePosition = throttle(updateMousePosition, 500);

    document.addEventListener('mousemove', updateMousePosition, {
      once: true,
    });
    document.addEventListener('mousemove', throttledUpdateMousePosition);

    return () => {
      document.removeEventListener('mousemove', updateMousePosition);
      document.removeEventListener('mousemove', throttledUpdateMousePosition);
    };
  }, []);

  return mousePosition;
};

function throttle(callback: (...args: any[]) => void, delay: number) {
  let previousCall = Date.now();

  return function (this: any, ...args: any[]) {
    const time = Date.now();

    if (time - previousCall >= delay) {
      previousCall = time;
      callback.apply(this, args);
    }
  };
}
