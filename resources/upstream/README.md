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
accepted public families are icons, configProvider, locale, spin, iconButton, button, divider, space, grid, layout, skeleton, highlight, progress and tooltip. All other
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

The `button` record accepts Button, ButtonGroup and SplitButtonGroup. Button
routes through the existing IconButton and private BaseButton leaf, captures
global defaults per instance, and preserves native form and activation behavior.
ButtonGroup uses registered direct DOM children instead of cloning React nodes;
SplitButtonGroup assigns nested descendants to their nearest split container and
cleans stale boundary classes. Native slot outlets preserve ownership when a
VDOM host rerenders through Vue interop. The record cites strict source/generated
declarations, pure Vapor and separate interop tests, live documentation, themed
styles, lifecycle cleanup and actual tarball consumers. There are no static
Button child components, public BaseButton value, or new menu/Divider behavior.

The `divider` record accepts horizontal/vertical layout, text alignment, dashed
lines, margins and native class/style/attribute forwarding against the fixed
upstream component and its two SCSS sources. It creates no Foundation instance
or component-specific global defaults; direction and theme inherit from DOM/CSS.
A stable horizontal slot outlet classifies mounted DOM without invoking slots
for inspection; empty/conditional content, numeric zero and mixed nodes have
explicit Vue differences. Vertical layout does not mount content, and observer
cleanup is verified on unmount. The root exports the component only; DividerProps
and DividerSlots are subpath types. Strict declarations, live examples, dark/RTL
geometry, lifecycle tests and actual tarballs cover pure Vapor and interop
separately. Browser screenshots do not establish pixel equivalence or component
SSR, hydration or CJS support. ButtonGroup's private line remains independent.

The `space` record accepts the fixed inline-flex root, alignment, direction,
horizontal-only wrap and named/numeric two-axis gaps. It creates no Foundation
state machine or new ConfigProvider defaults. React children become one native
Vapor default slot with no item wrappers or VNode inspection; the browser
determines flex items, including text and whitespace behavior. Source/emitted
types, live Chinese examples, dynamic keyed content and focus, dark/RTL/narrow
geometry, and four real tarball consumers are checked separately from ordinary
Vue interop. The exact Vue RC/vue-jsx peer combination still rejects an
independent strict TSX compiler installation; precompiled consumers do not
remove that limit. Root exposes the Space value and ./space exposes its types;
screenshots do not establish pixel equivalence or SSR, hydration or CJS.

The `grid` record accepts Row and Col against the fixed component source and
Foundation SCSS: 24 columns, the fixed viewport breakpoints, both gutter axes,
responsive column classes, alignment, nesting and RTL. Row provides reactive
gutter context to its nearest descendant Col instances; native Vapor slots keep
their owners and state. Grid does not adopt ConfigProvider's custom responsive
map. Root exports Row and Col values; ./grid exposes values and public types,
with aggregate and standalone grid styles. Real browser resizing, dynamic
children, strict declarations, documentation and four tarball consumers are
cited separately from ordinary Vue interop. The existing TSX peer, Chromium,
pixel-parity and SSR/hydration/CJS limits remain in force.

The `layout` record accepts Layout and its static Header, Footer, Content and
Sider against the fixed source and two Foundation SCSS files. Root exposes only
the Layout value; ./layout exposes its public types. Each Sider registers with
the nearest Layout by instance identity, so dynamic, multiple and nested
sidebars update direction without VNode inspection or slot probing. Native
Vapor slots preserve ownership, while changing tagName replaces the root and
remounts its children. Sider breakpoints report media matches without automatic
collapse; the Vapor adapter also resubscribes when breakpoint props change.
The fixed Sider declares role but does not render it. Strict declarations,
browser semantics and geometry, live Chinese examples and four isolated
tarball consumers passed local verification and independent review. The
existing TSX peer, Chromium, pixel-parity and SSR/hydration/CJS limits remain.

The `skeleton` record accepts Skeleton and its static Avatar, Title, Button,
Paragraph and Image placeholders against the fixed source, Chinese docs and
four Foundation SCSS files. The browser root exports only Skeleton; ./skeleton
exports its default/named value and public types. Native Vapor named/default
slots replace ReactNode placeholder/children inputs. Switching loading
branches remounts their contents, so local state and focus do not persist
across transitions. CSS drives the active animation without JS handles.
Strict declarations, Chromium behavior, Chinese examples and three direct
Skeleton tarball consumer surfaces passed; the separate patched Foundation
tarball remains a regression flow. Explicit differences include the upstream
generator's undefined type crash, Paragraph native-attribute forwarding and
the fixed SCSS missing a dimension rule for Avatar size `default`. Independent
Avatar, Typography and Image public families remain unaccepted. The existing
TSX peer, Chromium, pixel-parity and SSR/hydration/CJS limits remain.

The `progress` record accepts the fixed line/circle, indeterminate, direction,
size, SVG geometry, color and accessible-value contract. It reuses the existing
animation lifecycle scope and three pinned Foundation SCSS files without a new
Foundation class or patch. Complex formatting uses an owned native `format`
slot with a readonly percentage ref; scalar callbacks run only when visible.
The opaque motion object/function type controls truthiness only and has explicit
bidirectional differences from the upstream type. Nonfinite input handling,
animation cancellation, stable SVG identity and body-level color-token lookup
are documented separately. Host reduced-motion CSS is distinct from component
behavior. Strict declarations, real browser updates, Chinese examples and four
tarball consumer stages passed independent review. No status API, state icons,
default slot, imperative method or additional public family is introduced.

The `tooltip` record accepts the browser Tooltip contract with five trigger modes,
sixteen placements, Foundation visibility/geometry and the fixed themed styles.
Native scoped slots bind current-document HTML callback refs and composed events;
content callbacks return synchronous primitives, while rich content and custom
arrows use owned slots. Reactive content, nonzero measurements, positioning,
CSS motion, reversal, focus/ARIA and teardown are covered by source browser tests,
strict declarations, live documentation and actual tarball consumers, with pure
Vapor and ordinary Vue interop kept separate. Production inlining is restricted
to the eighteen pinned Tooltip/base/a11y/log and es-toolkit source files, their
original-extension snapshots, bidirectional graph/provenance/map checks and two
full MIT notices. The existing Foundation patch pin and runtime dependency
policy remain unchanged. There is no automatic child inspection, SVG/MathML or
foreign-realm trigger support, async rich callback, component SSR/hydration or
CJS acceptance. The independent compiler installation peer constraint remains
separate from precompiled browser and plain declaration consumers.
