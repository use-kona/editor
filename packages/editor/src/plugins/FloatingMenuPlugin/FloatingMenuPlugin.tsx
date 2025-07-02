import { useStore } from '@nanostores/react';
import { type MapStore, map } from 'nanostores';
import type { IPlugin } from '../../types';
import { FloatingMenu } from './FloatingMenu';
import type { Options } from './types';

export class FloatingMenuPlugin implements IPlugin {
  $store: MapStore<{
    isVisible: boolean;
    focused: HTMLElement | null;
  }>;

  constructor(private options: Options) {
    this.$store = map({
      focused: null,
    });
  }

  openOnElement = (element: HTMLElement) => {
    this.$store.setKey('focused', element);
    this.$store.setKey('isVisible', true);
  };

  ui({ readOnly }) {
    const { focused, isVisible } = useStore(this.$store);

    return readOnly ? null : (
      <FloatingMenu
        focused={focused}
        isVisible={isVisible}
        onVisibilityChange={(isVisible) => {
          this.$store.setKey('isVisible', isVisible);
        }}
        options={{
          ...this.options,
          onHide: () => {
            this.$store.setKey('focused', null);
            return this.options.onHide();
          },
        }}
      />
    );
  }
}
