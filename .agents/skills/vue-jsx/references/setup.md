# Setup — Vite, TypeScript, ESLint

Full configuration snippets for a project using `vue-jsx`. Read this file when the user is wiring up a fresh project or diagnosing a setup issue.

---

## 1. Vite Plugin

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vueJsx from 'vue-jsx/vite'

export default defineConfig({
  plugins: [vueJsx()],
})
```

### Plugin options

```ts
vueJsx({
  vapor: false,     // true → Vapor Mode output (requires Vue 3.6)
  optimize: true,   // compile-time optimizations
  mergeProps: true, // merge props
  sourceMap: true,
  hmr: true,
  macros: true,     // enable defineModel / defineExpose / defineStyle
})
```

---

## 2. TypeScript `tsconfig.json`

### Pure Vue codebase

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "vue-jsx"
  }
}
```

### Mixed React + Vue codebase

Do NOT set `jsxImportSource` globally. Use a per-file pragma at the top of every Vue `.tsx`:

```tsx
/** @jsxImportSource vue-jsx */
```

The pragma must be the very first comment in the file (above imports).

---

## 3. ESLint (flat config)

```ts
// eslint.config.ts
import vueJsx from '@vue-jsx/eslint'

export default [vueJsx()]
```

### Recommended rules

```ts
export default [
  vueJsx({
    rules: {
      // Sort props; reserve directives
      'vue-jsx/jsx-sort-props': [
        2,
        {
          reservedFirst: ['v-if', 'v-for', 'v-show'],
          reservedLast: ['v-slot', 'v-model'],
        },
      ],
      // Format defineStyle bodies via Prettier
      'vue-jsx/define-style': [1, { tabWidth: 2 }],
    },
  }),
]
```

`jsx-sort-props` is a modified `@stylistic/jsx/jsx-sort-props` that supports the `reservedFirst` / `reservedLast` arrays.

### After migrating from `vue-jsx-vapor`

Rename rule prefixes:

```diff
- 'vue-jsx-vapor/define-style': 'warn',
- 'vue-jsx-vapor/jsx-sort-props': 'warn',
+ 'vue-jsx/define-style': 'warn',
+ 'vue-jsx/jsx-sort-props': 'warn',
```

---

## 4. Package Installation

```bash
pnpm add vue-jsx
pnpm add vue
pnpm add -D @vue-jsx/eslint
pnpm add -D @vue-jsx/macros        # only if not using integrated vueJsx({ macros: true })
```

For TS-Macro editor support, install the `TS Macro` VS Code extension.

---

## 5. ts-macro.config.ts

Create `ts-macro.config.ts` at the project root for editor support of `.tsx` macros.

```ts
import vueJsx from 'vue-jsx/volar'

export default {
  plugins: [vueJsx()],
}
```

When `macros: true` is enabled in Vite, mirror the same option here:

```ts
export default {
  plugins: [vueJsx({ macros: true })],
}
```

The two configurations MUST stay consistent.

---

## 6. Validation Checklist

After setup, verify:

- [ ] `vue-jsx/vite` is in `vite.config.ts`, NOT `@vitejs/plugin-vue-jsx`.
- [ ] `tsconfig.json` has `jsxImportSource: "vue-jsx"` (pure Vue) OR every `.tsx` has the pragma (mixed).
- [ ] `eslint.config.ts` imports `@vue-jsx/eslint` and uses `vue-jsx/` rule prefix.
- [ ] If macros used, Vite plugin AND `ts-macro.config.ts` both have `macros: true`.
- [ ] A test `.tsx` file type-checks and renders.