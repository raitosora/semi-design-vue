# Template: basic-component

**Scene**: new-component
**Intent**: Trivial presentational Vue JSX component with no state.
**Status**: ready

## When to use

- One-line static component (icons, labels, badges).
- No props, emits, slots, or lifecycle.
- No reactive state.

## When NOT to use

- The component needs any reactive state — use `defineComponent` instead.
- The component accepts props — use `typed-component`.

## Primitive

```tsx
export default () => <span class="hello">hello</span>
```

## Acceptance

- [ ] Single arrow function returning JSX.
- [ ] Default export.
- [ ] No `defineComponent` wrapper.
- [ ] No reactive state.

## Code

See `widget-code.tsx`.