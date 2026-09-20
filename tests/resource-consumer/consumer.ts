import IconHome, { IconHome as NamedHome } from "semi-icons-vue/IconHome";
import IconForm from "semi-icons-lab-vue/IconForm";
import IllustrationNoContent from "semi-illustrations-vue/IllustrationNoContent";
import type { SvgResourceProps } from "semi-icons-vue";
import enUS from "semi-ui-vue/locale/source/en_US";
import zhCN from "semi-ui-vue/locale/source/zh_CN";
import type { Locale } from "semi-ui-vue/locale/interface";

const named: typeof IconHome = NamedHome;
const props: SvgResourceProps = { size: "large", color: "rgb(12, 90, 190)" };
const locales: readonly Locale[] = [enUS, zhCN];
if (!enUS.dateFnsLocale.localize)
  throw new Error("English locale localize is missing");
const month: string = enUS.dateFnsLocale.localize.month(0, { width: "wide" });
// @ts-expect-error Resource size accepts the documented string/number forms only.
const invalidSize: SvgResourceProps = { size: false };
// @ts-expect-error Color remains a string SVG attribute.
const invalidColor: SvgResourceProps = { color: false };
void [
  named,
  IconForm,
  IllustrationNoContent,
  props,
  locales,
  month,
  invalidSize,
  invalidColor,
];
