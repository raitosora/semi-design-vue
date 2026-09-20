# Fixed upstream inputs

This directory is build-time audit data. It is outside every package's `files`
allowlist and must never be imported by runtime code or included in tarballs.
The source snapshot contains original text for syntax analysis; its React
wrappers are never evaluated, compiled into Vue packages, or treated as Vue
implementations.

- `sources.json`: selected official Git blobs, including the complete MIT license,
  package manifests, UI/Foundation/animation TypeScript and SCSS, and SVG inputs.
  Tests, stories, tooling and documentation are excluded by an explicit selector.
- `baseline.json`: generated named root exports, module families, static members,
  type syntax, package subpaths and resource inventory with source fingerprints.
- `facilities.json`: explicit links to existing internal facilities, fixtures and
  resource checks. These entries do not claim public component delivery.
- `matrix.json`: generated current exports and differences, separate existence,
  public delivery and behavior acceptance dimensions.

The fixed official source is Semi Design 2.103.0 at
`8bed560dd3f36579f85b7a522f19762f2bace756` in
[DouyinFE/semi-design](https://github.com/DouyinFE/semi-design).
The snapshot's sorted path/content SHA256 is pinned in
`scripts/upstream-source.mjs`. Editing inputs and their local metadata together
cannot silently change that baseline. The generator version and content hashes
are included in `baseline.json`. The retained source is MIT, with the full notice
also available in `third-party-licenses/semi-design-2.103.0-MIT.txt`.

Run `pnpm refresh:upstream` to clone the official fixed tag into a temporary
folder, verify its commit and extract the selected Git blobs. The optional
`--checkout <path>` accepts an independently obtained official Git clone; the
working tree is not read. Normal generation and CI checks require neither that
clone nor network access: `pnpm generate:upstream` and `pnpm check:upstream` use
the committed snapshot. A changed fixed tag, missing object, empty input or
content drift fails. Updating pins is a separately reviewed maintenance change.

The inventory is syntax evidence, not semantic type equivalence or behavior
acceptance. Current public component delivery and acceptance are explicitly
unestablished. The first actual public component must add reviewed acceptance
records and extend that policy; names and files alone cannot promote it.
