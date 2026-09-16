# JSX Namespace & Type Augmentation

`vue-jsx` is typed in pure TypeScript — no editor plugin required. This file covers the `JSX` namespace import rules and how to extend the JSX type system.

---

## 1. The `JSX` namespace

`vue-jsx` does **NOT** register a global `JSX` namespace. Whenever `JSX.Element`, `JSX.IntrinsicElements`, `JSX.IntrinsicAttributes` etc. is referenced in a **type position**, an explicit import is required:

```ts
import type { JSX } from 'vue-jsx'
```

Without the import, type-checking fails because there is no ambient `JSX`.

---

## 2. Restoring a Global `JSX` Namespace (Legacy Shim)

For large existing codebases with many global `JSX` references, add a `global.d.ts`:

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

**New code MUST still prefer the explicit `import type { JSX } from 'vue-jsx'`** — the shim is only for legacy compatibility.

---

## 3. Extending JSX Types — TWO Non-Negotiable Rules

### Rule A: The file MUST be a module

The augmentation file MUST contain at least one top-level `import` or `export`. An empty `export {}` counts.

**Why**: in a plain script file (no module markers), `declare module 'vue-jsx'` becomes an **ambient** module declaration that shadows the real package — and every type exported from `vue-jsx` disappears. JSX checking then breaks globally.

### Rule B: Target `'vue-jsx'`, NOT `'@vue-jsx/runtime'`

**Why**: the internal `@vue-jsx/runtime` package is not the module named in `jsxImportSource`. Augmenting it has no effect on JSX checking.

---

## 4. Correct Pattern

```ts
// types/jsx.d.ts
import type { JSX } from 'vue-jsx'

declare module 'vue-jsx' {
  namespace JSX {
    interface IntrinsicElements {
      'my-widget': {
        value?: string
        onCustomEvent?: (e: CustomEvent<{ id: string }>) => void
      }
    }
  }
}

export {} // ← makes this file a module
```

Then:

```tsx
<my-widget value="x" onCustomEvent={(e) => console.log(e.detail.id)} />
```

---

## 5. Common Mistakes

### Mistake 1: Missing module marker

```ts
// ❌ Wrong — no import/export
declare module 'vue-jsx' {
  namespace JSX {
    interface IntrinsicElements { 'my-widget': {} }
  }
}
```

Result: `vue-jsx` exports silently vanish. JSX type-checking breaks project-wide.

Fix: add `export {}` or any import.

### Mistake 2: Targeting the wrong module

```ts
// ❌ Wrong
declare module '@vue-jsx/runtime' {
  namespace JSX { interface IntrinsicElements { 'my-widget': {} } }
}
```

Result: types are added to the wrong module. JSX checking ignores them. `<my-widget />` is `any`.

Fix: target `'vue-jsx'`.

### Mistake 3: Using global `JSX` without import

```ts
// ❌ Wrong
const el: JSX.Element = <div />
```

Result: `Cannot find name 'JSX'`.

Fix: `import type { JSX } from 'vue-jsx'`.

---

## 6. Augmentation Checklist

When creating a `.d.ts` that extends JSX:

- [ ] File contains at least one `import` or `export` (add `export {}` if needed).
- [ ] `declare module 'vue-jsx'` — not `'@vue-jsx/runtime'`.
- [ ] `interface IntrinsicElements` (not `type`) for custom element prop types.
- [ ] `JSX` namespace imported from `'vue-jsx'` if referenced inside the augmentation.