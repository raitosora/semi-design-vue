import { Highlight } from "../../packages/semi-ui-vue/src/index";
import HighlightSubpath, {
  type HighlightProps,
} from "../../packages/semi-ui-vue/src/components/highlight/index";

const props: HighlightProps = {
  autoEscape: undefined,
  caseSensitive: false,
  sourceString: "Semi Design Vue",
  searchWords: [
    "Semi",
    { text: "Vue", className: "vue", style: { color: "red" } },
  ],
  highlightStyle: { fontWeight: 700, color: "blue" },
  highlightClassName: "matches",
  component: "strong",
};
const upstreamDeclaredWord: HighlightProps["searchWords"] = [undefined];
const positive = (
  <>
    <Highlight {...props} />
    <HighlightSubpath />
    <HighlightSubpath
      component={undefined}
      searchWords={undefined}
      sourceString={undefined}
    />
  </>
);
void [upstreamDeclaredWord, positive];
