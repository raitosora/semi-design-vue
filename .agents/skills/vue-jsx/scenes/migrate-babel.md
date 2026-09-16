# Scene: Migrate from `@vitejs/plugin-vue-jsx` (Babel) to `vue-jsx`

**Use this scene** when the user has an existing project using the Babel-based Vue JSX plugin and wants to migrate to the modern `vue-jsx` compiler.

Full details in `references/migration.md` §1.

---

## Workflow

1. **Replace the Vite plugin**
   ```diff
   - import vueJsx from '@vitejs/plugin-vue-jsx'
   + import vueJsx from 'vue-jsx/vite'
   ```

2. **Update `tsconfig.json`**
   ```diff
   - "jsxImportSource": "vue"
   + "jsxImportSource": "vue-jsx"
   ```
   Or revert the global setting and add per-file pragma in mixed repos.

3. **Audit JSX namespace usage**
   - If code uses global `JSX.Element` etc. without import → either:
     - Add the shim from `references/jsx-namespace.md` §2, OR
     - Add `import type { JSX } from 'vue-jsx'` to each file.

4. **Convert string-form directives to JSX attributes**
   ```tsx
   // ❌ Babel form
   <div v-if="ok">yes</div>
   <li v-for="item in list">{{ item.name }}</li>

   // ✅ vue-jsx form
   <div v-if={ok}>yes</div>
   <li v-for={item in list} key={item.id}>{item.name}</li>
   ```

5. **Update ESLint config**
   - Use `@vue-jsx/eslint`, prefix `vue-jsx/`.
   - Configure `jsx-sort-props` with `reservedFirst` / `reservedLast`.

6. **Smoke test**: dev server starts, production build succeeds, all components render.

7. **Run the Validate checklist.**

---

## Validate Checklist

- [ ] No `@vitejs/plugin-vue-jsx` references remain.
- [ ] `tsconfig.json` `jsxImportSource` is `"vue-jsx"` (or pragma in mixed repos).
- [ ] No global `JSX` references without import (or shim is in place).
- [ ] All directives are JSX attributes (no string literals).
- [ ] All list children have stable `key`.
- [ ] ESLint config uses `vue-jsx/` prefix.
- [ ] Dev + production builds succeed.
- [ ] Type check passes with zero errors.