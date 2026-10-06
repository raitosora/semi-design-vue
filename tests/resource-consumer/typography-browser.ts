import { createTextNode, type ComponentInstance, type Ref } from "vue";
import { Typography as RootTypography } from "semi-ui-vue";
import Typography, {
  Typography as NamedTypography,
  type TypographyProps,
  type TypographySlots,
  type TextProps,
  type TitleProps,
  type ParagraphProps,
  type CopyableConfig,
  type Ellipsis,
} from "semi-ui-vue/typography";
import Text from "semi-ui-vue/typography/text";
import Title from "semi-ui-vue/typography/title";
import Paragraph from "semi-ui-vue/typography/paragraph";
import Numeral, {
  type NumeralProps,
  type NumeralSlots,
} from "semi-ui-vue/typography/numeral";
const root: typeof Typography = RootTypography;
const named: typeof Typography = NamedTypography;
const parts: [typeof Text, typeof Title, typeof Paragraph, typeof Numeral] = [
  Typography.Text,
  Typography.Title,
  Typography.Paragraph,
  Typography.Numeral,
];
const props: TypographyProps = {
  component: "section",
  children: () => createTextNode("owned"),
  forwardRef: (element) => element?.focus(),
};
const slots: TypographySlots = { default: () => createTextNode("slot") };
const text: TextProps = { children: 0, weight: 600, link: { href: "/guide" } };
const title: TitleProps = { heading: 6, weight: "bold" };
const paragraph: ParagraphProps = {
  spacing: "extended",
  ellipsis: { rows: 2 },
};
const copy: CopyableConfig = {
  content: "copy",
  onCopy: (event, value, copied) =>
    void [event.type, value.toUpperCase(), copied],
  render: (copied) => createTextNode(String(copied)),
};
const ellipsis: Ellipsis = {
  pos: "middle",
  suffix: "END",
  expandable: true,
  collapsible: true,
  showTooltip: { renderTooltip: (_content, children) => children() },
};
const numeral: NumeralProps = {
  children: -1234.5,
  rule: "numbers",
  precision: 2,
  truncate: "round",
  parser: (value) => value.replace(/_/g, ""),
};
const numeralSlots: NumeralSlots = {
  default: (scope) => createTextNode(scope.format(1000)),
};
// @ts-expect-error No editable API.
const editable: TextProps = { editable: true };
// @ts-expect-error No unsafe HTML API.
const html: TypographyProps = { innerHTML: "unsafe" };
// @ts-expect-error Slots require native content.
const scalarSlot: TypographySlots = { default: () => "raw" };
// @ts-expect-error Native slots do not accept numeric primitives.
const numericSlot: TypographySlots = { default: () => 0 };
// @ts-expect-error Native arrays contain native results, not raw primitives.
const primitiveArraySlot: TypographySlots = { default: () => ["raw", 0] };
const primitiveRenderer: TypographyProps = { children: () => "raw" };
const numberRenderer: TypographyProps = { children: () => 0 };
// @ts-expect-error Renderers are synchronous.
const asyncContent: TypographyProps = { children: async () => null };
// @ts-expect-error No invented forwardRef on Text.
const textRef: TextProps = { forwardRef: () => undefined };
// @ts-expect-error Heading is restricted to six levels.
const heading: TitleProps = { heading: 7 };
// @ts-expect-error Numeral only exposes six source rules.
const currency: NumeralProps = { rule: "currency" };
// @ts-expect-error Numeral does not add currency configuration.
const currencyCode: NumeralProps = { currency: "USD" };
// @ts-expect-error Numeral does not declare ellipsis.
const numeralEllipsis: NumeralProps = { ellipsis: true };
// @ts-expect-error Numeral does not expose weight.
const numeralWeight: NumeralProps = { weight: 600 };
// @ts-expect-error Numeral truncate is closed to three rules.
const truncate: NumeralProps = { truncate: "trunc" };
// @ts-expect-error Numeral slot is synchronous.
const asyncNumeral: NumeralSlots = { default: async () => null };
declare const instance: ComponentInstance<typeof Typography>;
// @ts-expect-error No copy business method.
instance.copy();
declare const wrong: Ref<{ copy(): void }>;
// @ts-expect-error Instance does not expose copy.
const checked: Ref<ComponentInstance<typeof Typography>> = wrong;
void [
  root,
  named,
  parts,
  props,
  slots,
  text,
  title,
  paragraph,
  copy,
  ellipsis,
  numeral,
  numeralSlots,
  editable,
  html,
  scalarSlot,
  numericSlot,
  primitiveArraySlot,
  primitiveRenderer,
  numberRenderer,
  asyncContent,
  textRef,
  heading,
  currency,
  currencyCode,
  numeralEllipsis,
  numeralWeight,
  truncate,
  asyncNumeral,
  checked,
];
