# Template: custom-element-type

**Scene**: typescript-augment
**Intent**: Add TypeScript types for a Custom Element via `declare module 'vue-jsx'`.
**Status**: ready

## When to use

- You have a Custom Element (`my-widget`) that needs typed props/events.
- You want IntelliSense and type-checking when using `<my-widget />`.

## When NOT to use

- The element is a normal HTML element — types already exist.
- You're authoring a Vue component — use a typed-component template instead.

## Rules (enforced)

1. The file MUST be a module — add `export {}` at the end.
2. Target `declare module 'vue-jsx'`. NEVER `'@vue-jsx/runtime'`.
3. Use `interface IntrinsicElements` (not `type`) for custom element prop types.

## Code

See `types.d.ts`.

## Acceptance

- [ ] File is a module.
- [ ] `declare module 'vue-jsx'` (not `'@vue-jsx/runtime'`).
- [ ] `JSX` imported from `'vue-jsx'` if referenced.
- [ ] File is included in TypeScript program.
- [ ] `<my-widget value="x" />` type-checks without error.