import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildStyles } from "./style-inputs.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
await buildStyles({
  root,
  output: resolve(root, "packages/semi-ui-vue/dist/styles"),
});
