import { createTextNode, ref, type ComponentInstance } from "vue";
import { Typography as RootTypography, semiGlobal } from "semi-ui-vue";
import Typography, {
  Typography as NamedTypography,
  type TypographyProps,
  type TypographySlots,
  type CopyableConfig,
  type Ellipsis,
} from "semi-ui-vue/typography";
import Text, { type TextProps } from "semi-ui-vue/typography/text";
import Title, { type TitleProps } from "semi-ui-vue/typography/title";
import Paragraph, {
  type ParagraphProps,
} from "semi-ui-vue/typography/paragraph";
import Numeral, {
  type NumeralProps,
  type NumeralSlots,
} from "semi-ui-vue/typography/numeral";
const identity: typeof Typography = RootTypography;
const named: typeof Typography = NamedTypography;
const parts: [typeof Text, typeof Title, typeof Paragraph, typeof Numeral] = [
  Typography.Text,
  Typography.Title,
  Typography.Paragraph,
  Typography.Numeral,
];
const element = ref<HTMLElement | null>(null);
const props: TypographyProps = {
  component: "section",
  forwardRef: element,
  children: () => <strong>Native</strong>,
  className: "text",
  style: { color: "red" },
};
const slots: TypographySlots = {
  default: () => (
    <>
      <input />
      <span>Second root</span>
    </>
  ),
};
const copyable: CopyableConfig = {
  content: "copy",
  icon: () => <i />,
  onCopy: (event, text, result) => {
    void [event.type, text.toUpperCase(), result];
  },
  render: (_copied, copy, config) => (
    <button
      onClick={(event: unknown) => {
        if (event instanceof MouseEvent) copy(event);
      }}
    >
      {config.content}
    </button>
  ),
};
const ellipsis: Ellipsis = {
  rows: 2,
  expandable: true,
  collapsible: true,
  pos: "middle",
  suffix: "END",
  showTooltip: {
    renderTooltip: (content, children) => [
      createTextNode(String(typeof content)),
      children(),
    ],
  },
  onExpand: (expanded, event) => void [expanded, event.type],
};
const text: TextProps = {
  copyable,
  ellipsis,
  size: "inherit",
  weight: 600,
  link: { href: "/guide", target: "_blank" },
};
const title: TitleProps = { heading: 2, weight: "semibold" };
const paragraph: ParagraphProps = { spacing: "extended" };
const instance = ref<ComponentInstance<typeof Typography> | null>(null);
const fixture = <Typography {...props} ref={instance} v-slots={slots} />;
semiGlobal.configure({
  overrideDefaultProps: { Typography: { component: "article" } },
});
void [identity, named, parts, text, title, paragraph, fixture];

const numeralProps: NumeralProps = {
  children: -1.25,
  rule: "percentages",
  precision: 2,
  truncate: "floor",
  parser: (value) => value.replaceAll("_", ""),
};
const numeralSlots: NumeralSlots = {
  default: (scope) => <span>{scope.format(1024)}</span>,
};
void [numeralProps, numeralSlots];

// The children prop renderer can return primitives; default slots own native blocks.
const scalarRenderer = <Typography children={() => "text"} />;
const numericRenderer = <Typography children={() => 0} />;
const nativeTextSlot = (
  <Typography v-slots={{ default: () => createTextNode("text") }} />
);
const nativeFragmentSlot = (
  <Typography
    v-slots={{
      default: () => (
        <>
          <span>text</span>
          <input />
        </>
      ),
    }}
  />
);
void [scalarRenderer, numericRenderer, nativeTextSlot, nativeFragmentSlot];
