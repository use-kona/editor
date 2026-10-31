# Kona Editor

## Storybook

Run `pnpm install` from the repository root, then `pnpm storybook:editor` to
open Storybook at `http://localhost:6006`. Build it with
`pnpm --filter @use-kona/editor build:storybook`.

The stories and their example components live in `stories/`. Dependencies are
managed by the workspace's root `pnpm-lock.yaml`.

## Installing

```bash
npm install @use-kona/editor
```

## Using

```tsx
import { 
  KonaEditor, 
  BasicFormattingPlugin,
  /* rest of the plugins */
} from "@use-kona/editor";

const defaultValue = [
  { type: 'paragraph', children: [{ text: '' }]}
];

export const Editor = () => {
  return (
    <KonaEditor
      plugins={[
        new BasicFormattingPlugin(),
        // rest of the plugins
      ]}
      initialValue={defaultValue}
      onChange={console.log}
    />
  )
}
```
