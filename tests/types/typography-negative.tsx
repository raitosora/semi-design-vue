import { type ComponentInstance, type Ref } from "vue";
import Typography, {
  type TypographyProps,
  type TypographySlots,
  type TextProps,
  type TitleProps,
  type ParagraphProps,
  type CopyableConfig,
  type Ellipsis,
} from "semi-ui-vue/typography";
// @ts-expect-error Typography does not implement editable.
const editable: TextProps = { editable: true };
// @ts-expect-error Native content renderer must be synchronous.
const asyncContent: TypographyProps = { children: async () => null };
// @ts-expect-error Content does not accept arbitrary objects.
const object: TypographyProps = { children: { text: "x" } };
// @ts-expect-error Native slot must return native content.
const raw: TypographySlots = { default: () => "text" };
// @ts-expect-error Native slots do not accept raw numbers.
const rawNumber: TypographySlots = { default: () => 0 };
// @ts-expect-error Native slot arrays must contain native results.
const rawArray: TypographySlots = { default: () => ["text", 0] };
// @ts-expect-error Explicit v-slots keeps the native string boundary.
const explicitRaw = <Typography v-slots={{ default: () => "text" }} />;
// @ts-expect-error Explicit v-slots keeps the native numeric boundary.
const explicitNumber = <Typography v-slots={{ default: () => 0 }} />;
// @ts-expect-error Explicit v-slots keeps the native array boundary.
const explicitArray = <Typography v-slots={{ default: () => ["text", 0] }} />;
// @ts-expect-error Native slot must be synchronous.
const asyncSlot: TypographySlots = { default: async () => null };
// @ts-expect-error No invented named slot.
const footer: TypographySlots = { footer: () => <span /> };
// @ts-expect-error Unsafe HTML is not exposed.
const html: TypographyProps = { innerHTML: "unsafe" };
// @ts-expect-error Native ref expects an element.
const forwardRef: TypographyProps = { forwardRef: { value: 1 } };
// @ts-expect-error Text does not have Typography's DOM forwarding API.
const textRef: TextProps = { forwardRef: () => undefined };
// @ts-expect-error Heading is closed to the supported heading levels.
const heading: TitleProps = { heading: 7 };
// @ts-expect-error Text uses numeric weight.
const weight: TextProps = { weight: "bold" };
// @ts-expect-error Paragraph has no code API.
const code: ParagraphProps = { code: true };
// @ts-expect-error Ellipsis position is end or middle.
const position: Ellipsis = { pos: "start" };
// @ts-expect-error Copy payload is textual.
const copy: CopyableConfig = { content: 1 };
// @ts-expect-error Copy renderers are synchronous.
const asyncCopy: CopyableConfig = { render: async () => null };
declare const instance: ComponentInstance<typeof Typography>;
// @ts-expect-error No public business method is added.
instance.copy();
declare const incorrect: Ref<{ copy(): void }>;
// @ts-expect-error The instance does not expose copy.
const checked: Ref<ComponentInstance<typeof Typography>> = incorrect;
void [
  editable,
  asyncContent,
  object,
  raw,
  rawNumber,
  rawArray,
  explicitRaw,
  explicitNumber,
  explicitArray,
  asyncSlot,
  footer,
  html,
  forwardRef,
  textRef,
  heading,
  weight,
  code,
  position,
  copy,
  asyncCopy,
  checked,
];

import type {
  NumeralProps,
  NumeralSlots,
} from "semi-ui-vue/typography/numeral";
// @ts-expect-error Currency is not a supported rule.
const currency: NumeralProps = { rule: "currency" };
// @ts-expect-error No locale API.
const locale: NumeralProps = { locale: "zh-CN" };
// @ts-expect-error No Numeral weight.
const numeralWeight: NumeralProps = { weight: 600 };
// @ts-expect-error Upstream Numeral types do not expose ellipsis.
const numeralEllipsis: NumeralProps = { ellipsis: true };
// @ts-expect-error Truncation uses ceil/floor/round.
const truncate: NumeralProps = { truncate: "trunc" };
// @ts-expect-error Numeral slots must be synchronous.
const asyncNumeral: NumeralSlots = { default: async () => null };
void [currency, locale, numeralWeight, numeralEllipsis, truncate, asyncNumeral];
