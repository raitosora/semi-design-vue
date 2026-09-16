/**
 * vite.config.ts — Vapor Mode setup for vue-jsx.
 *
 * Both `vapor` and `macros` flags MUST match the values in ts-macro.config.ts.
 */
import { defineConfig } from 'vite'
import vueJsx from 'vue-jsx/vite'

export default defineConfig({
  plugins: [
    vueJsx({
      vapor: true,
      macros: true,
      optimize: true,
      mergeProps: true,
      sourceMap: true,
      hmr: true,
    }),
  ],
})