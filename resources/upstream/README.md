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
- `acceptance.json`: reviewer-owned acceptance decisions. A cited file path,
  matching export name, generated SVG, or successful gate never changes a family
  from pending. An accepted record needs all evidence categories and a completed
  verification review identifier. The current accepted family decisions and their explicit differences are
  recorded below and in `acceptance.json`.

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
unestablished except where `acceptance.json` contains an explicit completed
review decision. The `icons` record accepts the reviewed browser Icon contract
with explicit Vue API and environment differences; its content-hashed evidence
cites contract, implementation, source/declarations, browser, documentation,
consumer and limitation surfaces. Evidence categories are closed: browser,
documentation and consumer evidence must each include their corresponding test,
website or consumer surface. Every cited file is checked for formal location,
real path and content hash before use. Acceptance also requires every inventoried
root export of the family to exist. These checks validate record consistency;
they do not replace behavior tests or independent review. Direct SVG resources
do not claim Icon wrapper, `spin`, SSR/hydration, or CJS behavior.

The `configProvider` record accepts the browser ConfigProvider/ConfigConsumer
contract with native Vapor scoped slots, field inheritance, a stable directional
wrapper, responsive subscriptions and existing overlay context integration.
The record cites source and generated type checks, live documentation, browser
lifecycles and isolated tarball consumers. Its locale data forwarding is distinct
from the separately accepted locale family. Theme configuration remains external
CSS and native containers; no new theme prop is implied.

The `locale` record accepts LocaleProvider/LocaleConsumer with independent
subtree contexts, ConfigProvider precedence, whole-dictionary selection and the
upstream field fallback rules. Native Vapor scoped slots expose readonly refs;
explicit string-key generics replace the React callback type mechanism. The
record covers dynamic switching, nested and separate apps, teardown, strict
source/generated declarations and all 57 static language subpaths in actual
tarballs. Date language formatting is demonstrated separately from timeZone
configuration; no picker or automatic timezone conversion is accepted. The
accepted public families are icons, configProvider, locale, spin and iconButton. All other
public families remain unaccepted.

When a shared evidence file changes, rerun its affected checks and independently
review the new content before refreshing its hash and review identifier. An
unchanged component contract can retain its acceptance decision while its shared
consumer or documentation evidence receives a new verification identifier.

The `spin` record accepts the browser Spin contract: fixed size/default/loading
semantics, native content/indicator/tip slots, scoped delay cancellation and
instance-safe cleanup, and the upstream themed mask. Explicit differences cover
initial delayed visibility, effective global defaults, limited DOM attributes,
React-node conversion and timer races. The five fixed SCSS sources and their
licenses are verified; strict declarations, live examples and actual tarballs
exercise pure Vapor and interop separately. Existing Icon rotation and lifecycle
facilities are reusable evidence only; they do not substitute for Spin behavior.

The `iconButton` record accepts the native button/content structure, layered
defaults, icon position and horizontal padding, colorful icon scope, loading and
disabled precedence, native events and form actions. Its BaseButton dependency
is private and has no public export or group API. Native Vapor slots replace
React nodes and cloning; iconSize/iconStyle retain their upstream no-op behavior.
Strict declarations, live examples, animation disposal and isolated tarballs
cover browser execution; Node static imports do not establish component SSR,
hydration or CommonJS support.
