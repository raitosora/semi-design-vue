import { join } from "node:path";
import { buildIconStyles } from "../../scripts/build-icon-styles.mjs";
import {
  compileStyleEntries,
  prepareStyleSources,
} from "../../scripts/style-inputs.mjs";

/** Keep the complete Sass closure, compiling only the CSS this fixture reads. */
export async function buildStyleFixture({ root, output, entries }) {
  await prepareStyleSources({ root, output });
  await buildIconStyles({
    root,
    output: join(output, "icons"),
    metadataOutput: output,
  });
  await compileStyleEntries({ output, entries });
}
