import type { BaseEditor } from 'slate';
import type { ReactEditor } from 'slate-react';
import type { IPlugin } from './src';

type CustomElement = { type: string; children: CustomText[] };
type CustomText = { text: string };

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor &
      ReactEditor & {
        getCommands: <T extends IPlugin>(plugin: new () => T) => T['commands'];
      };
    Element: CustomElement;
    Text: CustomText;
  }
}
