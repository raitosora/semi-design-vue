import { fileURLToPath } from "node:url";
import { stageLocaleDistribution } from "./locale-inputs.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = new URL("../packages/semi-ui-vue/dist/", import.meta.url);

await stageLocaleDistribution({ root, output: fileURLToPath(output) });
console.log("Staged locale provenance and license notices.");
