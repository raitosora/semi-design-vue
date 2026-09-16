# Template: pragma-mixed-codebase

**Scene**: new-component
**Intent**: `.tsx` file using `/** @jsxImportSource vue-jsx */` in a mixed React + Vue codebase.
**Status**: ready

## When to use

- The project contains both React and Vue JSX files.
- `tsconfig.json` does NOT set `jsxImportSource` globally.
- Each Vue `.tsx` file declares its own JSX source via pragma.

## When NOT to use

- Pure Vue codebase — set `jsxImportSource` globally and skip the pragma.
- Pure React codebase — use React's JSX.

## Primitive

```tsx
/** @jsxImportSource vue-jsx */

import { defineComponent, ref } from 'vue'

export default defineComponent(() => {
  const n = ref(0)
  return () => <button onClick={() => n.value++}>{n.value}</button>
})
```

## Rules (enforced)

- The pragma MUST be the first comment in the file, above all imports.
- The file must still pass the standard JSX rules (directives, list keys, etc.).

## Acceptance

- [ ] Pragma is the first comment in the file.
- [ ] File type-checks without "global JSX" errors.
- [ ] No `import type { JSX }` is strictly required (the pragma alone is enough), but adding it is harmless.

## Code

See `widget-code.tsx`.