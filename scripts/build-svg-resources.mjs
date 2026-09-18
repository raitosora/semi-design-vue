import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkResourceInputs } from "./resource-inputs.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const kinds = {
  "semi-icons-vue": "icons",
  "semi-icons-lab-vue": "iconsLab",
  "semi-illustrations-vue": "illustrations",
};

export async function copyResourceProvenance(packageDirectory) {
  await checkResourceInputs(root);
  const packageName = basename(packageDirectory);
  const kind = kinds[packageName];
  if (!kind) throw new Error(`Unknown SVG resource package: ${packageName}.`);
  const manifest = JSON.parse(
    await readFile(join(root, "resources/svg/manifest.json"), "utf8"),
  );
  const provenance = {
    schema: manifest.schema,
    upstream: manifest.upstream,
    license: manifest.license,
    inputSha256: manifest.inputs[kind],
    count: manifest.counts[kind],
    exports: manifest.generated[kind],
    idIsolation: manifest.idIsolation,
  };
  const output = join(packageDirectory, "dist/resources");
  await mkdir(join(output, "licenses"), { recursive: true });
  await writeFile(
    join(output, "provenance.json"),
    JSON.stringify(provenance, null, 2) + "\n",
  );
  await writeFile(
    join(output, "licenses/semi-design-2.103.0-MIT.txt"),
    await readFile(
      join(root, "third-party-licenses/semi-design-2.103.0-MIT.txt"),
    ),
  );
  return provenance;
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  await copyResourceProvenance(process.cwd());
