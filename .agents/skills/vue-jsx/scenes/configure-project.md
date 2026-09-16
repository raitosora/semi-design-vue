# Scene: Configure a Fresh Vite + TS + ESLint Project with `vue-jsx`

**Use this scene** when the user is starting a new project (or adding vue-jsx to an existing Vue 3 + Vite + TS project that previously had no JSX support).

---

## Workflow

1. **Install packages**

   ```bash
   pnpm add vue-jsx
   pnpm add vue
   pnpm add -D @vue-jsx/eslint
   # Optional standalone macros (only if not using vueJsx({ macros: true }))
   pnpm add -D @vue-jsx/macros
   ```

2. **Update `vite.config.ts`** — see `references/setup.md` §1.

   ```ts
   import { defineConfig } from 'vite'
   import vueJsx from 'vue-jsx/vite'

   export default defineConfig({
     plugins: [vueJsx({ macros: true })],
   })
   ```

3. **Update `tsconfig.json`** — see `references/setup.md` §2.

   For pure Vue: set `jsxImportSource: "vue-jsx"`.
   For mixed: do NOT set globally; use per-file pragma.

4. **Update `eslint.config.ts`** — see `references/setup.md` §3.

   ```ts
   import vueJsx from '@vue-jsx/eslint'

   export default [
     vueJsx({
       rules: {
         'vue-jsx/jsx-sort-props': [
           2,
           { reservedFirst: ['v-if', 'v-for', 'v-show'], reservedLast: ['v-slot', 'v-model'] },
         ],
         'vue-jsx/define-style': [1, { tabWidth: 2 }],
       },
     }),
   ]
   ```

5. **Add `ts-macro.config.ts`** (if macros used).

   ```ts
   import vueJsx from 'vue-jsx/volar'

   export default {
     plugins: [vueJsx({ macros: true })],
   }
   ```

6. **Pull template for Vapor config** if targeting Vue 3.6 — see `templates/vapor-config/template.md`.

7. **Smoke test**: write a one-line `.tsx` component, render it in App.vue, ensure dev server starts and builds.

8. **Run the Validate checklist.**

---

## Validate Checklist

- [ ] `vue-jsx/vite` is the only JSX plugin in `vite.config.ts`.
- [ ] `tsconfig.json` has correct `jsxImportSource` (pure Vue) OR pragma in every Vue `.tsx` (mixed).
- [ ] `eslint.config.ts` uses `@vue-jsx/eslint` with `vue-jsx/` prefix.
- [ ] `jsx-sort-props` has `reservedFirst` and `reservedLast` directives.
- [ ] `ts-macro.config.ts` exists and matches Vite plugin options.
- [ ] Smoke `.tsx` component type-checks and renders in dev.
- [ ] Production build succeeds.