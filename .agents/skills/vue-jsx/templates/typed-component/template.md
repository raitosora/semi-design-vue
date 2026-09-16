# Template: typed-component

**Scene**: new-component
**Intent**: Vue JSX component with strongly-typed props and emits.
**Status**: ready

## When to use

- Component takes one or more props.
- Component emits one or more custom events.
- You want full type-safety at call sites.

## When NOT to use

- Trivial presentational — use `basic-component`.
- v-model with macro — use `macro-define-model`.

## Primitive pattern

```tsx
import { defineComponent } from 'vue'

interface Props {
  size: 'small' | 'large'
  disabled?: boolean
}

export default defineComponent<Props>((props) => {
  return () => (
    <button class={props.size} disabled={props.disabled}>
      <slot />
    </button>
  )
})
```

For emits, use `defineEmits` and forward to a parent handler:

```tsx
const emit = defineEmits<{
  (e: 'click', payload: { id: string }): void
}>()
```

## Acceptance

- [ ] Props are typed via interface.
- [ ] Setup returns a render function.
- [ ] Reactive reads happen inside the render function.
- [ ] Events use `onXxx` camelCase at call sites.

## Code

See `widget-code.tsx`.