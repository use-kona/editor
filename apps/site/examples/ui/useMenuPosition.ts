import { useCallback, useState } from 'react';

export type Coords = [number, number];

type Point = {
  x: number;
  y: number;
};

class Context {
  private readonly p: Point;
  private rect: DOMRect;

  constructor(p: Point, rect: DOMRect) {
    this.p = { x: p.x, y: p.y };
    this.rect = rect;
  }

  get point() {
    return this.p;
  }

  helpers = {
    isWithinWindow: (): [boolean, boolean] => {
      const left = this.p.x + this.rect.width;

      return [
        left < document.documentElement.clientWidth,
        this.p.y + this.rect.height < document.documentElement.clientHeight,
      ];
    },
  };

  flip = ([horizontal, vertical]: [boolean, boolean]) => {
    if (horizontal) {
      this.p.x -= this.rect.width;
    }
    if (vertical) {
      this.p.y -= this.rect.height;
    }

    return this;
  };

  move = (x: number, y: number) => {
    this.p.x += x;
    this.p.y += y;

    return this;
  };
}

export const useMenuPosition = (
  point: Point,
  transform: (context: Context) => Point,
) => {
  const [coords, setCoords] = useState<Point>(point);

  const ref = useCallback(
    (element: HTMLElement) => {
      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const newCoords = transform(new Context(point, rect));
      if (coords.x !== newCoords.x || coords.y !== newCoords.y) {
        setCoords(newCoords);
      }
    },
    [point.x, point.y],
  );

  return [ref, coords] as const;
};
