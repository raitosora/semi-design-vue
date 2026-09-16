---
description: "Rules for writing Vue components in JSX with vue-jsx (Rust/Oxc compiler). Enforces the correct compiler, JSX namespace import, module-augmentation rules, directive syntax, macros, ESLint prefix, and known pitfalls."
globs:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.ts"
  - "vite.config.ts"
  - "tsconfig*.json"
  - "eslint.config.ts"
  - "ts-macro.config.ts"
---

# Vue JSX Coding Rules (vue-jsx)

These rules enforce Vue JSX conventions used with the `vue-jsx` compiler (Rust + Oxc). They are **non-negotiable** — code that violates them either fails type-checking, breaks compilation, or ships anti-patterns.

---

## Rule 1. Compiler

**MUST** use `vue-jsx/vite` as the Vite JSX plugin. **MUST NOT** use `@vitejs/plugin-vue-jsx` or any Babel-based Vue JSX plugin.

```ts
// ✅ Correct
import vueJsx from 'vue-jsx/vite'
plugins: [vueJsx()]

// ❌ Forbidden
import vueJsxJsx from '@vitejs/plugin-vue-jsx'
```

---

## Rule 2. TypeScript `jsxImportSource`

- **Pure Vue codebase**: set globally in `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "jsx": "preserve",
      "jsxImportSource": "vue-jsx"
    }
  }
  ```
- **Mixed React + Vue codebase** (sharing one `tsconfig`): **MUST NOT** set `jsxImportSource` globally. **MUST** use the per-file pragma at the top of every Vue `.tsx`:
  ```tsx
  /** @jsxImportSource vue-jsx */
  ```
  Pragma MUST be the first comment, above all imports.

---

## Rule 3. JSX Namespace Import

`vue-jsx` does **NOT** register a global `JSX` namespace. When `JSX.Element`, `JSX.IntrinsicElements`, `JSX.IntrinsicAttributes`, or any other member is referenced in a **type position**, an explicit import is **required**:

```ts
// ✅ Required when using JSX types
import type { JSX } from 'vue-jsx'

// ❌ Forbidden in new code
declare const el: JSX.Element // no import → fails
```

For legacy codebases with many global `JSX` references, use the `global.d.ts` shim; new code **must** use the explicit import.

---

## Rule 4. Extending JSX Types

When augmenting JSX types, **all four** conditions must hold:

1. The file **MUST be a module** — contain at least one top-level `import` or `export`. Add `export {}` if no other exports exist.
2. The augmentation **MUST target `'vue-jsx'`**. Augmenting `'@vue-jsx/runtime'` has no effect on JSX checking.
3. Import `JSX` from `'vue-jsx'` (if used inside the augmentation).
4. Use `interface IntrinsicElements` (not `type`) for adding custom elements.

```ts
// ✅ Correct
// types/jsx.d.ts
import type { JSX } from 'vue-jsx'

declare module 'vue-jsx' {
  namespace JSX {
    interface IntrinsicElements {
      'my-widget': { foo?: string }
    }
  }
}

export {} // makes this a module
```

```ts
// ❌ Forbidden
declare module '@vue-jsx/runtime' { namespace JSX { interface IntrinsicElements { 'my-widget': {} } } }
declare module 'vue-jsx' { namespace JSX { interface IntrinsicElements { 'my-widget': {} } } }
// (no import/export → ambient declaration shadows real package)
```

---

## Rule 5. Directives **MUST** use JSX attribute form

Vue directives are written as JSX attributes — **never** as string literals:

```tsx
// ✅ Correct
<div v-if={ok} />
<li v-for={item in list} key={item.id} />
<Comp v-slot={{ default: (p) => <span>{p.text}</span> }} />

// ❌ Forbidden
<div v-if="ok" />            // string literal
<div v-for="item in list" /> // string literal
```

Event handlers use `onXxx` (camelCase). Event modifiers like `.stop` / `.prevent` are NOT supported in JSX — call `e.stopPropagation()` / `e.preventDefault()` inside the handler.

---

## Rule 6. ESLint Configuration

**MUST** use `@vue-jsx/eslint` with the `vue-jsx/` rule prefix. **MUST NOT** use `vue-jsx-vapor/` after migration.

**MUST** configure `jsx-sort-props` with directive reservations:

```ts
'vue-jsx/jsx-sort-props': [
  2,
  {
    reservedFirst: ['v-if', 'v-for', 'v-show'],
    reservedLast: ['v-slot', 'v-model'],
  },
],
```

**SHOULD** enable `define-style` for `defineStyle` formatting:

```ts
'vue-jsx/define-style': [1, { tabWidth: 2 }],
```

---

## Rule 7. Macros Configuration

When macros (`defineModel` / `defineExpose` / `defineStyle`) are used:

- Vite plugin **MUST** receive `macros: true`.
- TS-Macro plugin (`ts-macro.config.ts`) **MUST** mirror the **exact same** `macros` option.
- The two configurations **MUST** stay consistent. A mismatch breaks editor type-checking or compilation.

```ts
// vite.config.ts
plugins: [vueJsx({ macros: true, vapor: false })]

// ts-macro.config.ts
export default {
  plugins: [vueJsx({ macros: true, vapor: false })],
}
```

---

## Rule 8. `defineModel` Usage

```tsx
// ✅ Correct
const modelValue = defineModel<string>()!    // required
const optional = defineModel<string>()         // optional

// Use synchronous reads
modelValue.value = 'foo'
console.log(modelValue.value) // OK, no await nextTick()
```

**MUST NOT** `await nextTick()` after assigning a `defineModel` value — values are read synchronously.

**MUST** append `!` (`defineModel<T>()!`) when the model is required.

---

## Rule 9. `defineExpose` Usage

Use `defineExpose({ ... })` to declare exposed component members. Compiled to `currentInstance.exposed = { ... }`.

```tsx
// ✅ Correct
const Comp = () => {
  defineExpose({ foo: 1 })
  return <div />
}
```

---

## Rule 10. List Keys

**MUST** provide a stable `key` for every element rendered via `v-for` or `.map()`:

```tsx
// ✅ Correct
list.map((x) => <li key={x.id}>{x.name}</li>)

// ❌ Forbidden
list.map((x) => <li>{x.name}</li>)
```

---

## Rule 11. Component Definition

Prefer `defineComponent` for typed props and emit inference. Use plain functions for trivial presentational components.

```tsx
// ✅ Acceptable
export default defineComponent<{ size: 'small' | 'large' }>((props) => {
  return () => <div class={props.size} />
})

// ✅ Acceptable for trivial cases
export default () => <div>hi</div>
```

`defineComponent` setups **MUST** return a render function (so reactivity is read in the right scope).

---

## Rule 12. Refs

Use `useRef()` from `vue-jsx` for typing convenience:

```tsx
// ✅ Preferred
import { useRef } from 'vue-jsx'
const r = useRef<HTMLInputElement>()
return <input ref={r} />

// ✅ Acceptable
import { ref } from 'vue'
const r = ref<HTMLInputElement | null>(null)
```

---

## Rule 13. Slots

Pass slot content as an **object** mapping slot name → render function. The `default` key is the unnamed slot.

```tsx
// ✅ Correct
<Layout>{{
  header: () => <h1 />,
  default: () => <p />,
}}</Layout>

// ✅ Shorthand — single function child = default slot
<Layout>{() => <p />}</Layout>

// ❌ Forbidden — string children are not slot functions
<Layout>{"hello"}</Layout>
```

---

## Rule 14. Vapor Mode

- **MUST** stay on default **Virtual DOM** mode unless the application is ready for Vue 3.6.
- When enabling Vapor: set `vapor: true` in **both** Vite and TS-Macro plugins, with identical options.
- Vapor component semantics differ from Virtual DOM — review the migration guide before flipping the flag.

---

## Rule 15. Custom Elements

- The same JSX syntax is used for consuming and defining Custom Elements, in both Virtual DOM and Vapor modes.
- TypeScript types **MUST** be augmented in a module file targeting `vue-jsx` (see Rule 4).

---

## Rule 16. Anti-Patterns (Forbidden)

| ❌ Anti-pattern | ✅ Correct |
|---|---|
| `@vitejs/plugin-vue-jsx` | `vue-jsx/vite` |
| Augmenting `@vue-jsx/runtime` | Augment `vue-jsx` |
| `declare module 'vue-jsx'` in a non-module file | Add `export {}` or an import |
| Global `JSX.Element` without import | `import type { JSX } from 'vue-jsx'` |
| Global `jsxImportSource` in mixed React/Vue repo | Per-file pragma |
| `await nextTick()` after `defineModel` mutation | Read synchronously |
| Inconsistent options between Vite and TS-Macro | Mirror exactly |
| `vue-jsx-vapor/` ESLint prefix post-migration | `vue-jsx/` |
| Missing `key` in lists | Provide stable `key` |
| String directive literals `'v-if'` | JSX attribute `v-if={cond}` |
| Event modifiers `.stop` / `.prevent` | Call `e.stopPropagation()` / `e.preventDefault()` |
| `defineModel<T>()` missing `!` when required | `defineModel<T>()!` |
| Slot children as plain strings/elements | Pass a render function |

---

## Rule 17. File-Creation Checklist

Before creating any `.tsx` component file:

- [ ] If mixed codebase: pragma `/** @jsxImportSource vue-jsx */` at top.
- [ ] `import type { JSX } from 'vue-jsx'` if JSX types are referenced.
- [ ] `defineComponent` or named function with default export.
- [ ] Render function returns JSX (for reactivity).
- [ ] Stable `key` on every `v-for` / `.map()` child.
- [ ] Directives as JSX attributes, not string literals.
- [ ] Events as `onXxx` camelCase props.
- [ ] If macros used: `macros: true` in Vite **and** TS-Macro with matching options.
- [ ] Slots passed as object map `{ name: () => JSX }`.

---

## Rule 18. Module Augmentation Checklist

Before creating any `.d.ts` that augments JSX:

- [ ] File contains `import` or `export` (add `export {}` if needed).
- [ ] `declare module 'vue-jsx'` — not `'@vue-jsx/runtime'`.
- [ ] `interface IntrinsicElements` for custom element prop types.
- [ ] `JSX` namespace imported from `'vue-jsx'` if referenced.

---

## Rule 19. Migration Rules

### From `@vitejs/plugin-vue-jsx`

1. Replace plugin with `vue-jsx/vite`.
2. Set `compilerOptions.jsxImportSource = "vue-jsx"`.
3. Stay on Virtual DOM mode first.
4. Enable Vapor only when targeting Vue 3.6.
5. Update any global `JSX` references to explicit `import type { JSX } from 'vue-jsx'`, OR add the `global.d.ts` shim.

### From `vue-jsx-vapor`

1. Rename ESLint rule prefix from `vue-jsx-vapor/` to `vue-jsx/`.
2. Update Vite plugin import to `vue-jsx/vite`.
3. Mirror options in `ts-macro.config.ts`.

---

## Rule 20. Quick Reference Cheatsheet

```tsx
/** @jsxImportSource vue-jsx */  // pragma only when mixed

import { defineComponent, ref, computed } from 'vue'
import type { JSX } from 'vue-jsx'
import { useRef } from 'vue-jsx'

export default defineComponent(() => {
  const count = ref(0)
  const double = computed(() => count.value * 2)
  const inputRef = useRef<HTMLInputElement>()
  const model = defineModel<string>()!

  return () => (
    <div v-show={count.value >= 0} class="root">
      {count.value % 2 === 0 && <span>even</span>}
      <ul>
        {[1, 2, 3].map((x) => <li key={x} v-for={x}>{x}</li>)}
      </ul>
      <input
        ref={inputRef}
        value={model.value}
        onInput={(e) => (model.value = (e.target as HTMLInputElement).value)}
      />
      <button onClick={() => count.value++}>{double.value}</button>
    </div>
  )
})
```

### Task → action

| Task | Action |
|------|--------|
| Add Vite plugin | `vueJsx()` from `vue-jsx/vite` |
| Set JSX source | `compilerOptions.jsxImportSource = "vue-jsx"` (or pragma) |
| Type JSX namespace | `import type { JSX } from 'vue-jsx'` |
| Extend JSX | `declare module 'vue-jsx'` in module file |
| ESLint | `@vue-jsx/eslint`, prefix `vue-jsx/` |
| Macros | `vueJsx({ macros: true })` + matching `ts-macro.config.ts` |
| Required model | `defineModel<string>()!` |
| Expose API | `defineExpose({ ... })` |
| Slot | `{ name: () => <x /> }` object |
| Event | `onClick={...}` camelCase |
| Directive | `v-if={...}` JSX attribute |
| List key | Always provide `key={item.id}` |