import { createServer } from "node:http";
import { readFileSync } from "node:fs";

// Only private packed packages are served here. Public package metadata and
// tarballs come from npm, without inheriting any repository registry settings.
export async function startPackedRegistry(packages) {
  const requests = [];
  let origin;
  const server = createServer((request, response) => {
    try {
      const path = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      ).slice(1);
      const pack = packages.find(({ manifest }) => manifest.name === path);
      const archive = packages.find(
        ({ archiveName }) => path === `tarballs/${archiveName}`,
      );
      if (pack) {
        requests.push({ name: pack.manifest.name, type: "metadata" });
        const version = {
          ...pack.manifest,
          dist: {
            tarball: `${origin}/tarballs/${pack.archiveName}`,
            integrity: pack.integrity,
          },
        };
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            name: pack.manifest.name,
            "dist-tags": { latest: pack.manifest.version },
            versions: { [pack.manifest.version]: version },
          }),
        );
      } else if (archive) {
        requests.push({ name: archive.manifest.name, type: "tarball" });
        response.writeHead(200, { "content-type": "application/octet-stream" });
        response.end(readFileSync(archive.path));
      } else {
        response.writeHead(307, {
          location: `https://registry.npmjs.org${request.url}`,
        });
        response.end();
      }
    } catch (error) {
      response.writeHead(500, { "content-type": "text/plain" });
      response.end(error.message);
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  origin = `http://127.0.0.1:${server.address().port}`;
  return {
    origin,
    requests,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      }),
  };
}
