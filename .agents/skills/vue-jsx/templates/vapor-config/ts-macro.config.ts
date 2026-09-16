/**
 * ts-macro.config.ts — TS-Macro editor integration for Vapor Mode.
 *
 * The options here MUST match vite.config.ts EXACTLY. A mismatch breaks
 * editor type-checking vs. runtime behavior.
 */
import vueJsx from 'vue-jsx/volar'

export default {
  plugins: [
    vueJsx({
      vapor: true,
      macros: true,
    }),
  ],
}