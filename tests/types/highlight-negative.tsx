import Highlight, {
  type HighlightProps,
} from "../../packages/semi-ui-vue/src/components/highlight/index";

const invalidSource = (
  // @ts-expect-error Highlight accepts text, not arbitrary nodes or numbers.
  <Highlight sourceString={123} />
);
const invalidWords = (
  // @ts-expect-error The UI contract exposes an array, despite Foundation's string fallback.
  <Highlight searchWords="word" />
);
const invalidRegex = (
  // @ts-expect-error Regex patterns are strings used with autoEscape=false, not RegExp objects.
  <Highlight searchWords={[/word/]} />
);
const invalidObject = (
  // @ts-expect-error Every complex keyword requires text.
  <Highlight searchWords={[{ className: "only-class" }]} />
);
const invalidWordStyle = (
  // @ts-expect-error Per-keyword style values follow upstream Record<string, string>.
  <Highlight searchWords={[{ text: "word", style: { fontWeight: 700 } }]} />
);
const invalidBoolean = (
  // @ts-expect-error autoEscape is boolean.
  <Highlight autoEscape="true" />
);
const invalidComponent = (
  // @ts-expect-error component is a tag string, not a render callback.
  <Highlight component={() => <span />} />
);
const invalidProps: HighlightProps = {
  // @ts-expect-error There is no root wrapper/className prop.
  className: "wrapper",
};
const invalidStyle: HighlightProps = {
  // @ts-expect-error Style belongs to highlightStyle, not an imaginary root wrapper.
  style: { color: "red" },
};
const invalidSlots: HighlightProps = {
  // @ts-expect-error Highlight does not provide a slot API.
  "v-slots": { default: () => <span /> },
};
const invalidRenderer: HighlightProps = {
  // @ts-expect-error Highlight does not provide a render callback API.
  render: () => <span />,
};
void [
  invalidSource,
  invalidWords,
  invalidRegex,
  invalidObject,
  invalidWordStyle,
  invalidBoolean,
  invalidComponent,
  invalidProps,
  invalidStyle,
  invalidSlots,
  invalidRenderer,
];
