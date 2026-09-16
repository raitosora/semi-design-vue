import { defineConfig } from "vite";
import vueJsx from "vue-jsx/vite";

export default defineConfig({
  plugins: [vueJsx({ vapor: true, macros: true })],
});
