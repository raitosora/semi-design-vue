import { fileURLToPath } from "node:url";
import tsconfig from "../tsconfig.base.json" with { type: "json" };

export const sourceAliases = Object.entries(tsconfig.compilerOptions.paths).map(
  ([name, [source]]) => ({
    find: new RegExp(
      `^${name.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace("*", "(.*)")}$`,
    ),
    replacement: fileURLToPath(
      new URL(`../${source.replace("*", "$1")}`, import.meta.url),
    ),
  }),
);
