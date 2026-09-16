# Template: macro-define-model

**Scene**: new-component
**Intent**: Component using `defineModel<T>()!` for v-model.
**Status**: ready

## When to use

- The component exposes a `v-model` binding.
- You want synchronous reads after assignment (no `await nextTick()`).
- You're willing to enable `macros: true` in Vite + TS-Macro.

## When NOT to use

- You can't enable macros in your project — fall back to manual `defineProps` + `emit('update:modelValue', ...)`.
- The component has multiple distinct v-models — use named `defineModel('key')!`.

## Primitive

```tsx
import { defineModel } from 'vue-jsx'

export default defineComponent(() => {
  const value = defineModel<string>()!
  return () => (
    <input
      value={value.value}
      onInput={(e) => (value.value = (e.target as HTMLInputElement).value)}
    />
  )
})
```

## Acceptance

- [ ] `macros: true` is set in `vite.config.ts` AND `ts-macro.config.ts`.
- [ ] `defineModel<T>()!` (or no `!` if optional).
- [ ] No `await nextTick()` after assigning.
- [ ] Consumer uses `v-model={...}` or wires up `update:modelValue` manually.

## Code

See `widget-code.tsx`.