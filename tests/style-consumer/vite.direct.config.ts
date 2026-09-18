import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "direct-dist",
    emptyOutDir: true,
    rollupOptions: { input: "direct.html" },
  },
});
