# Macros — defineModel / defineExpose / defineStyle + TS-Macro

Macros are **compile-time** helpers. They look like runtime functions but are replaced during JSX compilation. They are not imported — they're transformed by the compiler.

With `vue-jsx@3.3.0-rc.2`, `defineModel` and `defineExpose` are not named exports from `vue-jsx`. Call them directly with `macros: true` enabled in both the compiler and TS-Macro. Import runtime helpers separately: `ref` / `defineComponent` from `vue`, and `useRef` from `vue-jsx`.

Official reference: [Vue JSX macros](https://vuejsx.dev/zh/features/macros.html).

---

## 1. Enabling Macros

### Vite

```ts
// vite.config.ts
plugins: [vueJsx({ macros: true })]
```

### ts-macro.config.ts (for `.tsx` editor support)

Install the **TS Macro** VS Code extension, then create `ts-macro.config.ts` at the project root:

```ts
import vueJsx from 'vue-jsx/volar'

export default {
  plugins: [vueJsx()],
}
```

When macros are enabled in Vite, mirror the same option here:

```ts
export default {
  plugins: [vueJsx({ macros: true })],
}
```

**The options in Vite and TS-Macro MUST match.** A mismatch breaks editor type-checking or compilation.

### Standalone Plugin (Virtual DOM only)

If you don't use `vueJsx({ macros: true })`, install `@vue-jsx/macros`:

```bash
pnpm add @vue-jsx/macros -D
```

```ts
// vite.config.ts
import jsxMacros from '@vue-jsx/macros/vite'

export default {
  plugins: [jsxMacros()],
}
```

---

## 2. `defineModel`

Used inside a component to declare a `v-model` prop with a paired `update:modelValue` emitter.

### Basic usage

```tsx
function Comp() {
  const modelValue = defineModel<string>()  // optional
  // or:
  const required = defineModel<string>()!  // required
  return <div>{modelValue.value}</div>
}
```

### Compiled shape

The macro compiles to:

```ts
const modelValue = useModel<string>(_props, 'modelValue', { required: true })
```

So you must have `useModel` available in the runtime (provided by `@vue-jsx/macros` or `vue-jsx` itself).

### Synchronous reads (no `await nextTick()`)

```tsx
function Comp() {
  const value = defineModel<string>()!
  value.value = 'foo'
  console.log(value.value) // 'foo' — synchronous
  return <div>{value.value}</div>
}
```

**MUST NOT** `await nextTick()` after assigning a `defineModel` value — values are read synchronously.

### Multiple models with named keys

```tsx
function Comp() {
  const a = defineModel<string>('a')!
  const b = defineModel<number>('b')!
  // emits: update:a, update:b
  return <div>{a.value} / {b.value}</div>
}
```

### Consumer

```tsx
const foo = ref('')
return <input value={foo.value} onInput={(e) => (foo.value = e.target.value)} />
```

Or with `v-model`:

```tsx
const foo = ref('')
return <Comp v-model={foo.value} />
```

---

## 3. `defineExpose`

Compiles to setting `currentInstance.exposed = { ... }`. Equivalent to the SFC macro.

### Declaring exposed members

```tsx
const Comp = ({ foo = undefined as unknown }) => {
  defineExpose({ foo })
  return <div />
}
```

### Reading from parent

```tsx
import { useRef } from 'vue-jsx'

export default () => {
  const compRef = useRef()
  const foo = computed(() => compRef.value?.foo)
  return (
    <>
      <Comp ref={compRef} foo={42} />
      <p>{foo.value}</p>
    </>
  )
}
```

### Compiled shape

```ts
import { currentInstance } from 'vue'
import { useRef } from 'vue-jsx'
import { useExpose } from '/vue-macros/jsx-macros/use-expose'

const Comp = ({ foo }) => {
  currentInstance.exposed = {
    foo,
  }
  return <div />
}
```

---

## 4. `defineStyle`

Defines scoped styles inside a TSX component.

```tsx
export default () => {
  defineStyle(`
    .root { padding: 16px; }
    .title { font-weight: 600; }
  `)
  return <div class="root"><h1 class="title">hi</h1></div>
}
```

The body is formatted by Prettier via the ESLint rule `vue-jsx/define-style`:

```ts
'vue-jsx/define-style': [1, { tabWidth: 2 }],
```

---

## 5. Built-in vs Custom Macros

The macros above are built-in to `vue-jsx` itself. Custom macros can be added via:

- The `vueJsx/volar` plugin (TypeScript Macro extension).
- A separate Volar plugin.

---

## 6. Validation Checklist

When using macros:

- [ ] `macros: true` in BOTH `vite.config.ts` AND `ts-macro.config.ts`.
- [ ] For required models, append `!` (`defineModel<T>()!`).
- [ ] No `await nextTick()` after `defineModel` assignments.
- [ ] `defineExpose` members are read via `compRef.value?.xxx` from parent.
- [ ] `defineStyle` bodies pass Prettier formatting check.