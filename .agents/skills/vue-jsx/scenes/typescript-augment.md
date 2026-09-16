# Scene: Extending JSX Types for Custom Elements

**Use this scene** when the user needs TypeScript types for a custom element, or wants to extend the JSX type system (add a global prop type, override an intrinsic element type, etc.).

---

## Workflow

1. **Confirm the augmentation module name**
   - The module named in `jsxImportSource` is the augmentation target.
   - For `vue-jsx`, target is `'vue-jsx'`.
   - NEVER target `'@vue-jsx/runtime'` (it has no effect on JSX checking).

2. **Confirm the file is a module**
   - The `.d.ts` MUST contain at least one top-level `import` or `export`.
   - If the file has no real exports, add `export {}` at the end.

3. **Choose the interface to extend**
   - `JSX.IntrinsicElements` — for adding/changing HTML or Custom Element prop types.
   - `JSX.IntrinsicAttributes` — for adding project-wide attributes.
   - Custom interfaces inside the namespace — for typing helpers.

4. **Pull template**
   - See `templates/custom-element-type/template.md` for a working sample.

5. **Write the augmentation** following the pattern in `references/jsx-namespace.md`.

6. **Verify the file appears in the TypeScript program**
   - Either `include` the `.d.ts` in `tsconfig.json`, OR place it where it's automatically picked up (e.g. `src/types/`).

7. **Run the Validate checklist.**

---

## Validate Checklist

- [ ] File is a module (has `import`/`export`).
- [ ] `declare module 'vue-jsx'` — NOT `'@vue-jsx/runtime'`.
- [ ] `JSX` namespace is imported from `'vue-jsx'` if referenced inside.
- [ ] Extension uses `interface` (not `type`) for `IntrinsicElements`.
- [ ] File is included in TypeScript program (via `tsconfig.json` `include` or auto-discovery).
- [ ] Custom element now type-checks: `<my-widget value="x" />` has no error.

---

## Common Patterns

### Add a Custom Element

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

export {}
```

### Override an existing intrinsic element

```ts
declare module 'vue-jsx' {
  namespace JSX {
    interface IntrinsicElements {
      a: {
        href: string
        target?: '_blank' | '_self'
      }
    }
  }
}

export {}
```

### Add a project-wide attribute

```ts
declare module 'vue-jsx' {
  namespace JSX {
    interface IntrinsicAttributes {
      'data-testid'?: string
    }
  }
}

export {}
```