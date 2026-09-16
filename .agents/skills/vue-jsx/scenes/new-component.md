# Scene: Authoring a New Vue `.tsx` Component

**Use this scene** when the user asks to write a new Vue component in `.tsx`/`.jsx`.

---

## Workflow

1. **Confirm the JSX import mode**
   - Pure Vue codebase → rely on global `tsconfig.json` `jsxImportSource: "vue-jsx"`.
   - Mixed React + Vue codebase → add `/** @jsxImportSource vue-jsx */` as the first line of the file.

2. **Decide on `defineComponent` vs plain function**
   - Trivial presentational: plain function `export default () => <div />`.
   - Anything else (props, emits, slots, lifecycle): `defineComponent(() => { ... return () => <jsx /> })`.

3. **Pull the right template**
   - Simple function component → `templates/basic-component/`.
   - Typed props + emits → `templates/typed-component/`.
   - Uses `v-model` with macro → `templates/macro-define-model/`.
   - Parent reads child via ref → `templates/macro-define-expose/`.
   - Mixed codebase needs pragma → `templates/pragma-mixed-codebase/`.

4. **Author the component**
   - Reactivity in setup (`ref`, `computed`, `watch`).
   - Return a render function that reads reactive values.
   - Provide stable `key` on every list child.
   - Directives as JSX attributes (`v-if={...}`, NOT string).
   - Events as `onXxx` camelCase.
   - Slots as `{ name: () => <x /> }` object.

5. **Run the Validate checklist below.**

6. **(If macros used)** confirm `macros: true` in both Vite and TS-Macro.

---

## Validate Checklist

- [ ] Pragma present if mixed codebase.
- [ ] `import type { JSX }` if JSX types are referenced.
- [ ] `defineComponent` setup returns a render function.
- [ ] All list children have stable `key`.
- [ ] All directives are JSX attributes (not strings).
- [ ] Events are `onXxx` camelCase.
- [ ] No string children used as slots.
- [ ] No `await nextTick()` after `defineModel` mutations.
- [ ] `defineModel<T>()!` only when required.
- [ ] If macros used: `macros: true` in BOTH Vite and TS-Macro.

---

## Examples

### Trivial component

```tsx
export default () => <span>hello</span>
```

### With state

```tsx
import { defineComponent, ref } from 'vue'

export default defineComponent(() => {
  const count = ref(0)
  return () => (
    <button onClick={() => count.value++}>{count.value}</button>
  )
})
```

### With props

```tsx
import { defineComponent, PropType } from 'vue'

interface Props {
  size: 'small' | 'large'
}

export default defineComponent<Props>((props) => {
  return () => <div class={props.size}>x</div>
})
```

### With `v-model` and macro

```tsx
import { defineModel } from 'vue-jsx'

export default defineComponent(() => {
  const value = defineModel<string>()!
  return () => (
    <input value={value.value} onInput={(e) => (value.value = e.target.value)} />
  )
})
```

### With `defineExpose`

```tsx
import { defineExpose, ref } from 'vue-jsx'

export default defineComponent(() => {
  const counter = ref(0)
  defineExpose({ increment: () => counter.value++ })
  return () => <button onClick={() => counter.value++}>{counter.value}</button>
})
```