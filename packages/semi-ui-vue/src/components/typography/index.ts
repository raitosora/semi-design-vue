import BaseTypography from "./Typography.js";
import Text from "./text.js";
import Title from "./title.js";
import Paragraph from "./paragraph.js";
import Numeral from "./numeral.js";
export type * from "./types.js";
export type { CopyableProps } from "./copyable.js";
export type { NumeralProps } from "./numeral.js";
export type TypographyType = typeof BaseTypography & {
  readonly Text: typeof Text;
  readonly Title: typeof Title;
  readonly Paragraph: typeof Paragraph;
  readonly Numeral: typeof Numeral;
};
export const Typography = /* @__PURE__ */ Object.assign(BaseTypography, {
  Text,
  Title,
  Paragraph,
  Numeral,
}) as TypographyType;
export default Typography;
