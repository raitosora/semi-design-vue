import IconHome, { IconHome as NamedHome } from "semi-icons-vue/IconHome";
import Icon, {
  convertIcon,
  Icon as NamedIcon,
  type IconHandle,
  type IconProps,
  type IconSize,
  type IconSlots,
} from "semi-icons-vue";
import IconFromSubpath, {
  Icon as NamedIconFromSubpath,
  type IconHandle as SubpathIconHandle,
  type IconProps as SubpathIconProps,
  type IconSize as SubpathIconSize,
  type IconSlots as SubpathIconSlots,
} from "semi-icons-vue/Icon";
import IconForm from "semi-icons-lab-vue/IconForm";
import IllustrationNoContent from "semi-illustrations-vue/IllustrationNoContent";
import type { SvgResourceProps } from "semi-icons-vue";
import {
  Icon as UiIcon,
  type IconHandle as UiIconHandle,
  type IconProps as UiIconProps,
  type IconSize as UiIconSize,
  type IconSlots as UiIconSlots,
} from "semi-ui-vue";
import UiIconFromSubpath, {
  Icon as NamedUiIconFromSubpath,
  type IconHandle as UiSubpathIconHandle,
  type IconProps as UiSubpathIconProps,
  type IconSize as UiSubpathIconSize,
  type IconSlots as UiSubpathIconSlots,
} from "semi-ui-vue/icons";
import enUS from "semi-ui-vue/locale/source/en_US";
import zhCN from "semi-ui-vue/locale/source/zh_CN";
import type { Locale } from "semi-ui-vue/locale/interface";

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

const named: typeof IconHome = NamedHome;
const props: SvgResourceProps = { size: "large", color: "rgb(12, 90, 190)" };
const iconIdentity: typeof Icon = NamedIcon;
const subpathIconIdentity: typeof Icon = IconFromSubpath;
const namedSubpathIconIdentity: typeof Icon = NamedIconFromSubpath;
const uiIconIdentity: typeof Icon = UiIcon;
const uiSubpathIconIdentity: typeof Icon = UiIconFromSubpath;
const namedUiSubpathIconIdentity: typeof Icon = NamedUiIconFromSubpath;
const iconSize: IconSize = "inherit";
const iconProps: IconProps = {
  size: iconSize,
  color: "rgb(12, 90, 190)",
  className: "consumer-icon",
  prefixCls: "semi",
  rotate: 90,
  spin: false,
  style: { fontSize: "31px" },
};
const iconSlots: IconSlots = {
  svg: ({ size, fill, id }) => {
    const fills: readonly string[] | undefined = fill;
    const slotSize: "1em" = size;
    const slotId: string = id;
    void [fills, slotSize, slotId];
    return null;
  },
};
const convertedIcon = convertIcon(({ fill, id, size }) => {
  const colors: readonly string[] | undefined = fill;
  const scopeId: string = id;
  const scopeSize: "1em" = size;
  void [colors, scopeId, scopeSize];
  return null;
}, "consumer");
const convertedIconIdentity: "Icon" = convertedIcon.elementType;
const iconHandle = null as IconHandle | null;
const element: HTMLSpanElement | null = iconHandle?.getElement() ?? null;
const sameProps: SubpathIconProps = iconProps;
const sameSize: SubpathIconSize = iconSize;
const sameSlots: SubpathIconSlots = iconSlots;
const sameHandle: SubpathIconHandle | null = iconHandle;
const uiProps: UiIconProps = iconProps;
const uiSize: UiIconSize = iconSize;
const uiSlots: UiIconSlots = iconSlots;
const uiHandle: UiIconHandle | null = iconHandle;
const uiSubpathProps: UiSubpathIconProps = iconProps;
const uiSubpathSize: UiSubpathIconSize = iconSize;
const uiSubpathSlots: UiSubpathIconSlots = iconSlots;
const uiSubpathHandle: UiSubpathIconHandle | null = iconHandle;
const sourceAndSubpathTypes: readonly true[] = [
  true satisfies Same<IconProps, SubpathIconProps>,
  true satisfies Same<IconSize, SubpathIconSize>,
  true satisfies Same<IconSlots, SubpathIconSlots>,
  true satisfies Same<IconHandle, SubpathIconHandle>,
];
const iconsAndUiTypes: readonly true[] = [
  true satisfies Same<IconProps, UiIconProps>,
  true satisfies Same<IconSize, UiIconSize>,
  true satisfies Same<IconSlots, UiIconSlots>,
  true satisfies Same<IconHandle, UiIconHandle>,
  true satisfies Same<IconProps, UiSubpathIconProps>,
  true satisfies Same<IconSize, UiSubpathIconSize>,
  true satisfies Same<IconSlots, UiSubpathIconSlots>,
  true satisfies Same<IconHandle, UiSubpathIconHandle>,
];
const locales: readonly Locale[] = [enUS, zhCN];
if (!enUS.dateFnsLocale.localize)
  throw new Error("English locale localize is missing");
const month: string = enUS.dateFnsLocale.localize.month(0, { width: "wide" });
// @ts-expect-error Resource size accepts the documented string/number forms only.
const invalidSize: SvgResourceProps = { size: false };
// @ts-expect-error Color remains a string SVG attribute.
const invalidColor: SvgResourceProps = { color: false };
// @ts-expect-error Icon accepts exactly six named sizes, not arbitrary labels.
const invalidIconSize: IconSize = "gigantic";
// @ts-expect-error Spin remains boolean.
const invalidSpin: IconProps = { spin: "true" };
// @ts-expect-error Custom SVG output is supplied through slots, never a ReactNode prop.
const invalidSvgNode: IconProps = { svg: "<svg />" };
const invalidSlotFill: IconSlots = {
  svg: ({ fill }) => {
    // @ts-expect-error Slot fills are readonly strings.
    return fill?.push("red");
  },
};
// @ts-expect-error convertIcon needs a renderable SVG slot.
const invalidConvertIcon = convertIcon(undefined, "consumer");
void [
  named,
  IconForm,
  IllustrationNoContent,
  props,
  locales,
  month,
  invalidSize,
  invalidColor,
  iconIdentity,
  subpathIconIdentity,
  namedSubpathIconIdentity,
  uiIconIdentity,
  uiSubpathIconIdentity,
  namedUiSubpathIconIdentity,
  iconProps,
  iconSlots,
  convertedIcon,
  convertedIconIdentity,
  element,
  sameProps,
  sameSize,
  sameSlots,
  sameHandle,
  uiProps,
  uiSize,
  uiSlots,
  uiHandle,
  uiSubpathProps,
  uiSubpathSize,
  uiSubpathSlots,
  uiSubpathHandle,
  sourceAndSubpathTypes,
  iconsAndUiTypes,
  invalidIconSize,
  invalidSpin,
  invalidSvgNode,
  invalidSlotFill,
  invalidConvertIcon,
];
