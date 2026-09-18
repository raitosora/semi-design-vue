import type { Plugin } from "vite";

export function resourceGraph(): Plugin {
  return {
    name: "resource-consumer-graph",
    generateBundle(_, bundle) {
      const modules = Object.values(bundle)
        .filter((entry) => entry.type === "chunk")
        .flatMap((entry) => Object.keys(entry.modules))
        .sort();
      this.emitFile({
        type: "asset",
        fileName: "resource-graph.json",
        source: JSON.stringify({ modules }, null, 2),
      });
    },
  };
}
