import { writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import type { Plugin } from "vite";

const forbidden =
  /(?:^|[/\\])(?:lodash(?:[-./\\@]|$)|@douyinfe[/\\]semi-foundation|react(?:[-./\\@]|$))/i;

// CSS @import and Sass loaded files are processed outside the JS module graph.
// Their inclusion/exclusion is checked against actual CSS output by the runner.
export function consumerGraph(report: string): Plugin {
  return {
    name: "style-consumer-graph",
    generateBundle() {
      const modules = [...this.getModuleIds()].sort();
      for (const id of modules) {
        if (forbidden.test(id))
          throw new Error(`Forbidden consumer bundle module: ${id}`);
        if (isAbsolute(id) && relative(process.cwd(), id).startsWith(".."))
          throw new Error(
            `Consumer bundle resolved outside the isolated consumer: ${id}`,
          );
      }
      writeFileSync(resolve(report), JSON.stringify({ modules }, null, 2));
    },
  };
}
