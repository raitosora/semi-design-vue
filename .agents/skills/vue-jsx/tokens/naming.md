# Naming & File Conventions

Shared naming conventions and file patterns used across Vue JSX templates and references.

---

## Component Files

| File | Extension | Notes |
|---|---|---|
| Component | `.tsx` (preferred) or `.jsx` | Default export = root component. |
| Type definitions | `.d.ts` | Place under `types/` or co-located with the component. |
| Augmentation file | `.d.ts` | Must end with `export {}` to be a module. |

### Naming convention

- **kebab-case for filenames**: `user-card.tsx`, `data-table.tsx`.
- **PascalCase for component names**: `<UserCard />`, `<DataTable />`.
- **camelCase for hooks/utilities**: `useUserData.ts`, `formatDate.ts`.

---

## Component Authoring

- Default export = the root component (the one consumers render).
- Named exports for helpers, sub-components, types.
- Use `defineComponent` when there are props, emits, slots, or state.
- Use plain functions ONLY for trivial presentational cases.

---

## Exports

```ts
// ✅ Default export for the root component
export default defineComponent(() => {
  return () => <div>root</div>
})

// ✅ Named export for sub-components
export const Header = defineComponent(() => {
  return () => <h1>title</h1>
})

// ✅ Named export for types
export type { UserCardProps }
```

---

## Imports

- Group by source: Vue → third-party → local.
- Always `import type` for types-only imports:

  ```ts
  import { defineComponent, ref } from 'vue'
  import type { PropType } from 'vue'
  import type { JSX } from 'vue-jsx'
  import { useRef } from 'vue-jsx'
  import { Button } from '@/components/Button'
  ```

---

## File Template Layout

```
src/
├── components/
│   └── user-card/
│       ├── UserCard.tsx         ← component
│       ├── types.ts             ← shared types
│       └── index.ts             ← re-exports
├── types/
│   └── jsx.d.ts                 ← JSX augmentation
└── App.tsx
```

---

## Forbidden Names

- ❌ `MyComponent.jsx` when TypeScript is configured — prefer `.tsx`.
- ❌ `component.tsx` (too generic).
- ❌ Default export with the same name as the directory — `user-card/UserCard.tsx` exporting default `UserCard` is correct; exporting default `userCard` is wrong.