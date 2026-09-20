import { isAbsolute, relative } from "node:path";
import type { Plugin } from "vite";

export function resourceGraph(mode: "vapor" | "interop" = "vapor"): Plugin {
  const inputs = new Set<string>();
  return {
    name: "resource-consumer-graph",
    enforce: "post",
    transform(_code, id) {
      inputs.add(id);
      if (
        /node_modules[/\\](?:@[^/\\]+[/\\])?semi-[^/\\]+[/\\].*\.[jt]sx$/.test(
          id,
        )
      )
        throw new Error(`Packed library JSX was recompiled: ${id}`);
      if (isAbsolute(id) && relative(process.cwd(), id).startsWith(".."))
        throw new Error(
          `Consumer compiled outside its isolated directory: ${id}`,
        );
    },
    generateBundle(_, bundle) {
      const modules = Object.values(bundle)
        .filter((entry) => entry.type === "chunk")
        .flatMap((entry) => Object.keys(entry.modules))
        .sort();
      for (const id of modules) {
        if (
          /(?:^|[/\\])(?:react(?:-dom)?|lodash(?:[-.][^/\\]+)?|@douyinfe[/\\]semi-foundation)(?:[/\\]|$)/i.test(
            id,
          )
        )
          throw new Error(`Forbidden consumer bundle module: ${id}`);
      }
      this.emitFile({
        type: "asset",
        fileName: "resource-graph.json",
        source: JSON.stringify(
          { mode, modules, compilationInputs: [...inputs].sort() },
          null,
          2,
        ),
      });
    },
  };
}
