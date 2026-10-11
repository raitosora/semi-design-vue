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
accepted public families are icons, configProvider, locale, spin, iconButton,
button, divider, space, grid, layout, skeleton, highlight, progress, tooltip,
popover, collapsible, overflowList, avatar, tag, badge, typography, empty, card and list
(24 families). All other public families remain unaccepted.

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
the fixed SCSS missing a dimension rule for Avatar size `default`. The Skeleton decision does not accept independent Avatar, Typography or Image
contracts; Avatar and Typography have separate acceptance records. Image
remains unaccepted. The existing
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

The `popover` record accepts the fixed Popover wrapper contract over the same
Tooltip Foundation, G11 overlay/event resources and G12 motion lifecycle. It
retains Popover defaults, card/arrow structure, roles for each trigger,
visibility rules and notification behavior. Native trigger refs and owned
content slots replace React child cloning. Synchronous primitive content
callbacks retain the Tooltip adaptation; rich content uses the content slot.
The instance exposes only `focusTrigger`; no title/footer API, public Arrow
component or extra public family is introduced. Arrow fill defaults apply only
to undefined; runtime null clears inline fill without extending the public type.
An explicit supported `focusTrigger` call can focus its connected native trigger
while its own guarded popup remains open. Its temporary focus exception ends
on focus departure or relevant option, root, layer, closure or disposal changes;
unrelated content/reposition updates preserve it. Custom and returnFocusOnClose=false
retain the fixed Foundation no-op, and higher nested focus ownership is
not bypassed. Guarded zero-delay blur settles after G11 focus redirection while
unguarded blur retains the Foundation timing. Existing Tooltip Escape,
hover clickToHide and focus reentry cancellation regressions remain covered.
Standalone Popover styles reuse only the pinned Tooltip motion keyframes and
two runtime motion classes, with explicit source adaptation metadata; they do
not fall back to the aggregate or full Tooltip visual stylesheet. Strict
source/declarations, numeric geometry, live Chinese examples, pure Vapor and
separate interop, resource teardown and four actual tarball consumers bind the
recorded browser contract. The existing production closure of eighteen sources,
two MIT licenses, Foundation patch, HTMLElement, current document and realm boundary
and strict compiler peer constraint are unchanged. No publication, component
SSR/hydration, CJS, full pixel, other browser or device acceptance is implied.

The `collapsible` record accepts the fixed controlled content container, dynamic
height measurement, keepDOM/lazyRender behavior, motion reversal and CSS timing.
Native Vapor slots retain their owners without child inspection. Existing G10
DOM and G12 animation resources provide measurement, cancellation and cleanup.
Strict declarations, numeric browser geometry, live Chinese examples and four
real tarball consumers bind the accepted contract. Focus, hidden/inert and ARIA
remain caller responsibilities; no trigger, accordion or extra public family
is implied. The existing compiler peer and SSR/hydration/CJS limits remain.

The `overflowList` record accepts the fixed collapse and scroll browser contract
with native owned content, stable keys, integer measured widths and scoped
resize/intersection/font/scheduling cleanup. Strict source/generated declarations,
real geometry, live Chinese examples, pure Vapor and separate Vue interop,
per-source four-dimensional coverage and four actual tarball consumer flows
passed complete local verification and independent review. Full-candidate
measurement, conservative convergence, external gap/margin layout limits and
shared raw scrolling fallback ownership remain explicit adaptation differences.
No additional public family, imperative ref, keyboard protocol, component SSR,
hydration, CJS, publication or full pixel-equivalence is accepted.
Native scrolling content uses separate `overflowStart` and `overflowEnd` slot
outlets with one-sided item arrays, while the raw `overflowRenderer` retains
its two-dimensional input and two-part result. These slot names preserve Vue
content ownership and are adaptation APIs, not additional upstream properties.

The `avatar` record accepts Avatar and AvatarGroup for native browser Vapor.
Image revision ownership covers loading, failure, source replacement and teardown;
only synchronous false cancels the default fallback. Live text geometry follows
the pinned Foundation formula through existing G10 resize and scheduling tools.
Native rich slots retain their owners and are not inspected, cloned or measured.
Group membership follows registered instances and actual DOM order; folded
Avatars stay mounted under hidden/inert state, while custom more renderers receive
readonly descriptors. This intentionally differs from React child cloning and
unmounting. Hover content layout belongs to callers; fixed top decorations can
occlude an unstyled mask. Strict declarations, real geometry, live Chinese
examples, full browser regressions and four isolated tarball consumers bind the
accepted contract. Fixed styles and licenses are retained without expanding the
Foundation patch or production closure. No Avatar.Group, imperative ref method,
public Image or other public family is introduced. The existing independent TSX
peer constraint, document/ref/realm limits and SSR/hydration/CJS and full pixel
parity exclusions remain.

The `tag` record accepts Tag, TagGroup and SplitTagGroup against the fixed source.
Tag captures global defaults per instance, compares click handlers with that
captured default, retains hidden DOM and follows the fixed close/keyboard event
order. TagGroup owns keyed native content and folds by item count, reusing the
existing Popover lifecycle without width measurement. SplitTagGroup decorates
direct DOM elements and cleans its own boundary markers; it does not inspect or
clone VNodes. Synchronous native render factories and interop host slots have
distinct ownership contracts. The upstream VaporRenderResult declaration includes
VNode in its union, but direct VNode-returning native factories are unsupported.
The independent split subpath is a packaging adaptation. No close-content API,
static group member, new public ref method or other component family is implied.
Strict declarations, four tarball flows, browser lifecycles, themed documentation
and representative visuals preserve the existing runtime and installation limits.

The `typography` record accepts Typography with its Text, Title, Paragraph and
Numeral static members against the fixed source, types and three Foundation
SCSS files. Native slots and synchronous renderers own their content; ellipsis
reads explicit string children without inspecting or cloning rich content.
Numeral uses the pinned Foundation formatter and formats native descendants
only through explicit scoped `format(value)` calls. Positive infinite byte
values are rejected to avoid the upstream nonterminating conversion loop.
Copying retains the fixed synchronous execCommand boolean result and feedback;
rich content requires explicit copyable.content. The copy adaptation retains
the pinned copy-text-to-clipboard 2.2.0 MIT notice. Only the container exposes
forwardRef to its native root; React class instance methods are not adapted.
Strict declarations, real browser measurements and ownership checks, Chinese
examples and four isolated tarball consumers bind this independent contract.
The existing explicit ARIA scope, current-document/realm, compiler peer,
SSR/hydration/CJS and full pixel-equivalence limits remain. No other public
family or additional consumer runtime dependency is accepted.

The `empty` record accepts the fixed Empty layout, image, title, description and
action content contract. The upstream component supplies neither a default
illustration nor an Empty Foundation state machine. Callers reuse the separately
tracked G08 illustrations; the isolated Empty stylesheet includes the pinned
Typography Title styles. Native slots and synchronous renderers retain content
ownership, while slot declaration presence and empty output remain distinct.
Body theme observation is enabled only by dark content present at mount and is
released on unmount. Data attributes and the documented class alias are adapted;
no role, live region, keyboard protocol, public ref method or other component
family is introduced. Strict declarations, four real tarball consumer flows,
DOM identity and lifecycle tests, themed documentation and tree-shaking support
this decision with the existing compiler peer, document/realm, SSR/hydration/CJS
and visual-equivalence limitations unchanged.

The `card` record accepts Card, CardGroup and the static Card.Meta child against
the fixed source. Card loading replaces only its Skeleton-owned body; header,
cover, actions and footer retain independent ownership. Native slots and
synchronous renderers preserve content without inspecting or cloning nodes;
slot declaration presence remains distinct from visible output. CardGroup is a
Space wrapper with a source default gap of 16 and a zero-gap grid mode. It does
not clone children or inherit Card props. Meta wraps supplied content without
creating Avatar or Typography implicitly. Primitive string titles reuse Title
ellipsis and Tooltip and require the existing explicit application ARIA scope;
boxed String values are not supported. The isolated styles include Typography,
Skeleton, Space and Tooltip; caller-composed Avatar and Button styles remain
separate. Strict declarations, ownership and lifecycle tests, themed examples,
real tarball consumers and tree-shaking checks support the documented contract.
No selected, size, layout, imperative ref method, new Foundation state machine
or additional public family is introduced. Existing compiler peer, current
document/realm, SSR/hydration/CJS and visual-equivalence limits remain.

The `list` record accepts List and its static List.Item child against the fixed
source. Data results append declared content; native data renderers own index
positions, while application-owned keyed declarative lists retain their keys.
Sparse data is rejected before renderer callbacks, an explicit difference in
callback and error ordering. Ordinary content supports native factories and
scalar/sparse arrays; data renderers require native blocks without scalar, null
or hole leaves. Boolean loading delegates to Spin while preserving content;
unsupported falsy runtime loading values retain the documented delayed-Spin
behavior. Locale empty text uses an internal div, not the public Empty component.

Ordinary Vue content slots are bridged through an application-owned native
List/Item tree. Direct VDOM h(List) content that creates h(List.Item) lacks the
locked RC9 scoped context and is not supported. The isolated stylesheet includes
Grid and Spin. Strict source and packed declarations, DOM/lifecycle and themed
browser checks, four real tarball consumer stages, tree-shaking and per-file
coverage support this reviewed contract. There is no rowKey, Item.Meta, actions,
new imperative ref method, List Foundation state machine or unrelated public
family. Compiler peer-installation, browser ESM, SSR/hydration/CJS and visual
equivalence limitations remain unchanged.
