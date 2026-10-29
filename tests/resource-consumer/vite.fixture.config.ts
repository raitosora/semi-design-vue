import { relative, resolve } from "node:path";
import { defineConfig } from "vite";
import vueJsx from "vue-jsx/vite";

const fixture = resolve("tests/resource-consumer");
const external = (id: string) =>
  /^(?:vue|semi-ui-vue|semi-animation-vue|semi-icons-vue|semi-icons-lab-vue|semi-illustrations-vue|vite-plugin-semi-theme)(?:\/|$)/.test(
    id,
  );

// This is fixture preparation by the producer, before isolated installation.
// No library implementation is resolved here: every library import is external.
export default defineConfig(({ mode }) => {
  const listBridge = mode === "list-interop";
  const breadcrumbBridge = mode === "breadcrumb-interop";
  const timelineBridge = mode === "timeline-interop";
  const descriptionsBridge = mode === "descriptions-interop";
  const entry = breadcrumbBridge
    ? "breadcrumb-bridge.tsx"
    : timelineBridge
      ? "timeline-bridge.tsx"
      : descriptionsBridge
        ? "descriptions-bridge.tsx"
        : listBridge
          ? "list-bridge.tsx"
          : "main.tsx";
  return {
    plugins: [
      vueJsx({ vapor: true, macros: true }),
      {
        name: "consumer-fixture-preparation-evidence",
        generateBundle(_options, bundle) {
          const modules = Object.values(bundle)
            .filter((entry) => entry.type === "chunk")
            .flatMap((entry) => Object.keys(entry.modules));
          if (
            !modules.some((id) =>
              id.endsWith(
                breadcrumbBridge
                  ? "breadcrumb-bridge.tsx"
                  : timelineBridge
                    ? "timeline-bridge.tsx"
                    : descriptionsBridge
                      ? "descriptions-bridge.tsx"
                      : listBridge
                        ? "list-bridge.tsx"
                        : "virtual-pointer.tsx",
              ),
            )
          )
            throw new Error("Application fixture was not compiled");
          for (const id of modules) {
            if (
              id.includes("/packages/") ||
              /node_modules\/(?:semi-|@douyinfe\/semi-)/.test(id)
            )
              throw new Error(`Fixture preparation compiled a library: ${id}`);
            if (/\.tsx$/.test(id) && !id.startsWith(`${fixture}/`))
              throw new Error(`Unexpected application TSX input: ${id}`);
          }
          this.emitFile({
            type: "asset",
            fileName: "fixture-compilation.json",
            source: JSON.stringify(
              {
                stage: "producer-precompiled-application-fixture",
                compiler: "vue-jsx@3.3.0-rc.2",
                modules: modules.map((id) =>
                  id.startsWith(`${fixture}/`)
                    ? `fixture:${relative(fixture, id)}`
                    : id.includes("/node_modules/")
                      ? `npm:${id.slice(id.lastIndexOf("/node_modules/") + 14)}`
                      : id,
                ),
                imports: Object.values(bundle)
                  .filter((entry) => entry.type === "chunk")
                  .flatMap((entry) => entry.imports),
              },
              null,
              2,
            ),
          });
        },
      },
    ],
    build: {
      minify: false,
      emptyOutDir: true,
      lib: {
        entry: resolve(fixture, entry),
        formats: ["es"],
        fileName: () =>
          breadcrumbBridge
            ? "prepared-breadcrumb-bridge.js"
            : timelineBridge
              ? "prepared-timeline-bridge.js"
              : descriptionsBridge
                ? "prepared-descriptions-bridge.js"
                : listBridge
                  ? "prepared-list-bridge.js"
                  : "prepared-app.js",
      },
      rolldownOptions: { external },
    },
  };
});
