# Template: macro-define-expose

**Scene**: new-component
**Intent**: Component exposing members via `defineExpose`, accessed by parent through a ref.
**Status**: ready

## When to use

- Parent component needs to call methods or read state on the child.
- You want a typed surface for the parent's ref access.

## When NOT to use

- The data should flow via props/events — use `defineProps` + `defineEmits`.
- You're using `v-model` — that's already a two-way channel.

## Primitive

```tsx
import { defineExpose, ref, useRef } from 'vue-jsx'

const Counter = defineComponent(() => {
  const n = ref(0)
  defineExpose({ increment: () => (n.value += 1) })
  return () => <button onClick={() => (n.value += 1)}>{n.value}</button>
})

export default defineComponent(() => {
  const counterRef = useRef<InstanceType<typeof Counter>>()
  return () => (
    <>
      <Counter ref={counterRef} />
      <button onClick={() => counterRef.value?.increment()}>+</button>
    </>
  )
})
```

## Acceptance

- [ ] `defineExpose({ ... })` declares the public surface.
- [ ] Parent reads via `childRef.value?.xxx`.
- [ ] `useRef` is preferred over `ref()` from `vue` for typing.

## Code

See `widget-code.tsx`.