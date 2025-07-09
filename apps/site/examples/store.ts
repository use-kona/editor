import { map } from 'nanostores';

type FloatingMenuMode = 'main' | 'link' | 'colors';

type Store = {
  isFloatingMenuOpen: boolean;
  floatingMenuMode: FloatingMenuMode;
  url?: string;
  emojiSearch: string;
};

export const $store = map<Store>({
  isFloatingMenuOpen: false,
  floatingMenuMode: 'main',
  emojiSearch: '',
});
