import { HighlightsPlugin } from '@use-kona/editor';
import type { Color } from '../../utils';

export default ({ colors }: { colors: Record<Color, string> }) =>
  new HighlightsPlugin({
    colors,
  });
