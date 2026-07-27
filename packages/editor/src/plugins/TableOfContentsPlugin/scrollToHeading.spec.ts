import { describe, expect, it, vi } from 'vitest';
import { scrollToHeading } from './scrollToHeading';

describe('scrollToHeading', () => {
  it('scrolls only the closest scroll container', () => {
    const scrollIntoView = vi.fn();
    const element = { scrollIntoView } as unknown as HTMLElement;

    scrollToHeading(element);

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
      container: 'nearest',
    });
  });
});
