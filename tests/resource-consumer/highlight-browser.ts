import { Highlight } from "semi-ui-vue";
import SubpathHighlight, {
  Highlight as NamedSubpathHighlight,
  type HighlightProps,
} from "semi-ui-vue/highlight";

const rootIdentity: typeof Highlight = SubpathHighlight;
const namedIdentity: typeof Highlight = NamedSubpathHighlight;
const props: HighlightProps = {
  sourceString: "Semi <b> + 😀",
  searchWords: [
    "Semi",
    { text: "<b>", className: "word", style: { color: "red" } },
  ],
  autoEscape: true,
  caseSensitive: false,
  component: "em",
  highlightClassName: "consumer-highlight",
  highlightStyle: { fontWeight: 600 },
};
const defaults: HighlightProps = {
  sourceString: undefined,
  searchWords: undefined,
  autoEscape: undefined,
  caseSensitive: undefined,
  component: undefined,
  highlightClassName: undefined,
  highlightStyle: undefined,
};
// Upstream declares undefined entries, although its Foundation throws for them.
const declaredUndefinedWord: HighlightProps = { searchWords: [undefined] };
// @ts-expect-error sourceString is text, not a node or callback.
const invalidText: HighlightProps = { sourceString: () => "Semi" };
// @ts-expect-error The runtime string fallback is not part of the declared API.
const invalidWords: HighlightProps = { searchWords: "Semi" };
// @ts-expect-error Raw RegExp instances are not search word objects.
const invalidRegex: HighlightProps = { searchWords: [/Semi/] };
// @ts-expect-error Complex search words require text.
const invalidWord: HighlightProps = { searchWords: [{ className: "word" }] };
const invalidWordStyle: HighlightProps = {
  // @ts-expect-error Word-specific style preserves the upstream string record.
  searchWords: [{ text: "Semi", style: { fontWeight: 600 } }],
};
// @ts-expect-error Highlight only supports a tag string, not a render callback.
const invalidComponent: HighlightProps = { component: () => "em" };
// @ts-expect-error Highlight has no generic root className API.
const invalidClass: HighlightProps = { className: "root" };
// @ts-expect-error Highlight has no generic root style API.
const invalidStyle: HighlightProps = { style: { color: "red" } };
// @ts-expect-error Highlight has no children API.
const invalidChildren: HighlightProps = { children: "Semi" };
// @ts-expect-error Boolean options remain boolean.
const invalidEscape: HighlightProps = { autoEscape: "true" };
void [
  rootIdentity,
  namedIdentity,
  props,
  defaults,
  declaredUndefinedWord,
  invalidText,
  invalidWords,
  invalidRegex,
  invalidWord,
  invalidWordStyle,
  invalidComponent,
  invalidClass,
  invalidStyle,
  invalidChildren,
  invalidEscape,
];
