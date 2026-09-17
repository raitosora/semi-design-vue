---
name: "vue-jsx"
description: "Write Vue components using the vue-jsx compiler (Rust/Oxc-powered). Invoke when user writes .tsx/.jsx components, configures Vite with vue-jsx, uses macros (defineModel/defineExpose/defineStyle), needs Vapor mode, Custom Elements, Volar/TS-Macro, or migrates from @vitejs/plugin-vue-jsx / vue-jsx-vapor."
---

# vue-jsx

Skill for writing Vue 3 components in JSX/TSX using the `vue-jsx` compiler. This skill is **self-contained** — every directive, macro, and configuration the agent needs is in this folder. No network access is required.

---

## When to Invoke

Invoke IMMEDIATELY when the user:

- Writes or asks to write a Vue component in `.tsx` / `.jsx`.
- Mentions `vue-jsx`, `@vue-jsx/eslint`, `vue-jsx/vite`, `vue-jsx/volar`, or `@vue-jsx/macros`.
- Asks to configure Vite with a Vue JSX plugin (replace Babel-based `@vitejs/plugin-vue-jsx`).
- Asks to use `defineModel` / `defineExpose` / `defineStyle` macros.
- Needs Vapor Mode, Custom Elements, or Volar/TS-Macro for `.tsx`.
- Migrates from `vue-jsx-vapor` or `@vitejs/plugin-vue-jsx`.

DO NOT invoke for plain `.vue` SFC authoring or unrelated Vue tasks.

---

## File Map

`{{SKILL_DIR}}` is this folder.

```
{{SKILL_DIR}}/
├── SKILL.md                    ← This file (entrypoint)
├── references/                 ← Deep documentation, read on demand
│   ├── setup.md                ← Vite, TypeScript, ESLint full setup
│   ├── jsx-namespace.md        ← JSX type import + extension rules
│   ├── directives.md           ← Full Vue directive reference in JSX form
│   ├── macros.md               ← defineModel / defineExpose / defineStyle + TS-Macro
│   ├── events-slots-refs.md    ← Events, slots, refs patterns
│   ├── custom-elements.md      ← Defining & consuming Custom Elements
│   ├── vapor.md                ← Vapor Mode opt-in
│   └── migration.md            ← Babel → vue-jsx, vue-jsx-vapor → vue-jsx
├── scenes/                     ← Scene routing — pick one and follow its workflow
│   ├── new-component.md        ← Authoring a new .tsx component from scratch
│   ├── typescript-augment.md   ← Extending JSX types for custom elements
│   ├── configure-project.md    ← Setting up Vite/TS/ESLint in a project
│   ├── migrate-babel.md        ← Migrating from @vitejs/plugin-vue-jsx
│   └── migrate-vapor.md        ← Migrating from vue-jsx-vapor
├── templates/                  ← Working code samples to copy or adapt
│   ├── manifest.json           ← Template registry
│   ├── basic-component/        ← Minimal function component
│   ├── typed-component/        ← Component with defineProps + emits
│   ├── custom-element-type/    ← .d.ts JSX augmentation example
│   ├── macro-define-model/     ← v-model with defineModel
│   ├── macro-define-expose/    ← Parent accesses child via ref
│   ├── pragma-mixed-codebase/  /** @jsxImportSource vue-jsx pragma
│   └── vapor-config/           ← Vite + TS-Macro Vapor setup
└── tokens/
    └── naming.md               ← File naming, naming conventions, export patterns
```

---

## Scene Router (Read First)

Pick exactly ONE scene based on the user's intent, then follow its workflow.

| User intent                                                  | Scene file                     |
| ------------------------------------------------------------ | ------------------------------ |
| Write a new Vue component in `.tsx`                          | `scenes/new-component.md`      |
| Add TypeScript types for a Custom Element / extend JSX types | `scenes/typescript-augment.md` |
| Set up vue-jsx in a fresh Vite + TS + ESLint project         | `scenes/configure-project.md`  |
| Migrate from `@vitejs/plugin-vue-jsx` (Babel)                | `scenes/migrate-babel.md`      |
| Migrate from `vue-jsx-vapor`                                 | `scenes/migrate-vapor.md`      |

After picking a scene, also pull any matching template from `templates/manifest.json`.

---

## Core Rules (Always Enforce)

These rules are non-negotiable. Code that violates them will fail type-checking, break compilation, or ship anti-patterns.

### Compiler Choice

- ✅ Use `vue-jsx/vite`.
- ❌ Never use `@vitejs/plugin-vue-jsx` or any Babel-based Vue JSX plugin.

### TypeScript `jsxImportSource`

- **Pure Vue codebase**: set globally in `tsconfig.json`:
  ```json
  { "compilerOptions": { "jsx": "preserve", "jsxImportSource": "vue-jsx" } }
  ```
- **Mixed React + Vue codebase**: do NOT set `jsxImportSource` globally. Use per-file pragma at the top of every Vue `.tsx`:
  ```tsx
  /** @jsxImportSource vue-jsx */
  ```
  Pragma MUST be the first comment, above all imports.

### JSX Namespace Import

`vue-jsx` does NOT register a global `JSX` namespace. When you reference `JSX.Element`, `JSX.IntrinsicElements`, etc. in a type position, ALWAYS import explicitly:

```ts
import type { JSX } from 'vue-jsx'
```

### Module Augmentation Rules (Two Non-Negotiables)

1. The file **MUST be a module** — contain at least one top-level `import` or `export`. Add `export {}` if no other exports exist. In a plain script file, `declare module 'vue-jsx'` becomes ambient and shadows the real package.
2. The augmentation **MUST target `'vue-jsx'`**. Augmenting `'@vue-jsx/runtime'` has no effect on JSX checking.

### Directives

Vue directives use the **JSX attribute form**, never string literals:

```tsx
✅ <div v-if={ok} />
✅ <li v-for={item in list} key={item.id} />
❌ <div v-if="ok" />
```

Event handlers use `onXxx` camelCase props. Event modifiers like `.stop` / `.prevent` are NOT supported in JSX — call `e.stopPropagation()` / `e.preventDefault()` in the handler.

### Macros Configuration Consistency

When using macros (`defineModel` / `defineExpose` / `defineStyle`):

- Vite plugin MUST receive `macros: true`.
- TS-Macro plugin (`ts-macro.config.ts`) MUST mirror the EXACT same `macros` option.

Mismatch breaks editor type-checking or compilation.

Call `defineModel` and `defineExpose` directly inside components. These are compiler macros, not named exports from `vue-jsx`; do not import them. Runtime helpers still need imports: `ref` / `defineComponent` from `vue`, and `useRef` from `vue-jsx`. See [Macros](references/macros.md).

### ESLint Prefix

- ✅ `@vue-jsx/eslint` with rule prefix `vue-jsx/`.
- ❌ Never use `vue-jsx-vapor/` after migration.

### List Keys

Always provide a stable `key` on every `v-for` / `.map()` element:

```tsx
✅ list.map((x) => <li key={x.id}>{x.name}</li>)
❌ list.map((x) => <li>{x.name}</li>)
```

### Slot Children

Slot children MUST be **render functions**, not raw strings or elements:

```tsx
✅ <Layout>{() => <p />}</Layout>
✅ <Layout>{{ default: () => <p /> }}</Layout>
❌ <Layout>{"hello"}</Layout>
```

### `defineModel` Is Synchronous

- Values are read synchronously after assignment — no `await nextTick()`.
- Append `!` to mark as required: `defineModel<string>()!`.

---

## Workflow (Generic)

1. Read the **Scene Router** table. Match the user's intent to one scene file.
2. Read that scene file. Follow its numbered workflow.
3. If the scene says "load a template," read `templates/manifest.json`, pick the right id, then read `templates/<id>/template.md` (and copy `widget-code.tsx` or `types.ts` as needed).
4. Apply the **Core Rules** above. Run the scene's "Validate" checklist.
5. When the user asks something outside the routed scene (e.g. "how do event modifiers work?" mid-task), read the relevant `references/*.md` file on demand.

---

## Reference Index (Read On Demand)

| Topic                                         | File                              |
| --------------------------------------------- | --------------------------------- |
| Full Vite / TS / ESLint config snippets       | `references/setup.md`             |
| JSX namespace, augmentation, restoration shim | `references/jsx-namespace.md`     |
| All Vue directives in JSX                     | `references/directives.md`        |
| All macros + TS-Macro setup                   | `references/macros.md`            |
| Events, slots, refs patterns                  | `references/events-slots-refs.md` |
| Custom Elements (consuming & defining)        | `references/custom-elements.md`   |
| Vapor Mode (Vue 3.6 output)                   | `references/vapor.md`             |
| Migration from Babel / `vue-jsx-vapor`        | `references/migration.md`         |
| File / naming conventions                     | `tokens/naming.md`                |

---

## Quick Cheatsheet

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

| Task               | Action                                                     |
| ------------------ | ---------------------------------------------------------- |
| Add Vite plugin    | `vueJsx()` from `vue-jsx/vite`                             |
| Set JSX source     | `compilerOptions.jsxImportSource = "vue-jsx"` (or pragma)  |
| Type JSX namespace | `import type { JSX } from 'vue-jsx'`                       |
| Extend JSX         | `declare module 'vue-jsx'` in module file with `export {}` |
| ESLint             | `@vue-jsx/eslint`, prefix `vue-jsx/`                       |
| Macros             | `vueJsx({ macros: true })` + matching `ts-macro.config.ts` |
| Required model     | `defineModel<string>()!`                                   |
| Expose API         | `defineExpose({ ... })`                                    |
| Slot               | `{ name: () => <x /> }` object                             |
| Event              | `onClick={...}` camelCase                                  |
| Directive          | `v-if={...}` JSX attribute                                 |
| List key           | Always provide `key={item.id}`                             |