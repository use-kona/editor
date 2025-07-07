# Kona Editor

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
