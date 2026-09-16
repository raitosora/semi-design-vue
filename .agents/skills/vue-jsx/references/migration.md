# Migration Guides

Two migration paths:

1. `@vitejs/plugin-vue-jsx` (Babel-based) → `vue-jsx/vite`
2. `vue-jsx-vapor` → `vue-jsx`

---

## 1. From `@vitejs/plugin-vue-jsx` (Babel)

### Step 1: Replace the plugin

```diff
- import vueJsx from '@vitejs/plugin-vue-jsx'
+ import vueJsx from 'vue-jsx/vite'
```

### Step 2: Update tsconfig

```diff
- "jsxImportSource": "vue"
+ "jsxImportSource": "vue-jsx"
```

For a mixed React + Vue repo, prefer the per-file pragma and revert global config.

### Step 3: Stay on Virtual DOM first

```ts
plugins: [vueJsx({ vapor: false })]
```

### Step 4: Handle global JSX references

If existing code uses `JSX.Element`, `JSX.IntrinsicElements` etc. without an import, add the global shim:

```ts
// global.d.ts
import type { JSX as VueJsx } from 'vue-jsx'

declare global {
  namespace JSX {
    type Element = VueJsx.Element
    type ElementClass = VueJsx.ElementClass
    type IntrinsicAttributes = VueJsx.IntrinsicAttributes
    interface IntrinsicElements extends VueJsx.IntrinsicElements {}
  }
}
export {}
```

OR update each file to use explicit `import type { JSX } from 'vue-jsx'`.

### Step 5: Update ESLint rule prefix (if migrating from `vue-jsx-vapor`)

See §2 below.

### Step 6: Audit directive syntax

`vue-jsx` uses JSX attribute form for directives. If any of your code uses string-form directives (a Babel leftover), convert them:

```tsx
// ❌ Babel form (won't compile under vue-jsx)
<div v-if="ok">yes</div>

// ✅ vue-jsx form
<div v-if={ok}>yes</div>
```

---

## 2. From `vue-jsx-vapor`

### Step 1: Rename ESLint rule prefix

```diff
- 'vue-jsx-vapor/define-style': 'warn',
- 'vue-jsx-vapor/jsx-sort-props': 'warn',
+ 'vue-jsx/define-style': 'warn',
+ 'vue-jsx/jsx-sort-props': 'warn',
```

### Step 2: Update Vite plugin import

```diff
- import vueJsx from 'vue-jsx-vapor/vite'
+ import vueJsx from 'vue-jsx/vite'
```

### Step 3: Mirror options in `ts-macro.config.ts`

```ts
import vueJsx from 'vue-jsx/volar'

export default {
  plugins: [vueJsx({ macros: true /* same options as before */ })],
}
```

### Step 4: Smoke test

Run dev server and build. Look for:
- Type errors referencing `vue-jsx-vapor` (stale imports).
- ESLint errors about unknown rule prefixes.
- Missing JSX namespace errors (add `import type { JSX } from 'vue-jsx'`).

---

## 3. Validation Checklist (Both Paths)

- [ ] `vue-jsx/vite` is the only JSX plugin in `vite.config.ts`.
- [ ] ESLint config uses `vue-jsx/` prefix, not `vue-jsx-vapor/`.
- [ ] `tsconfig.json` `jsxImportSource` is `"vue-jsx"` (or pragma is present in mixed repos).
- [ ] All global `JSX` references either imported explicitly OR shimmed.
- [ ] All directives use JSX attribute form (no string literals).
- [ ] Dev + production builds succeed.
- [ ] Type check passes.