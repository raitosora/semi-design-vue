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

// Browser/default exports use native Vapor components. Node conditions are
// rejected independently in the ordinary NodeNext tarball consumer.
import {
  ConfigProvider,
  ConfigConsumer,
  useConfigContext,
  type ConfigProviderProps,
  type ConfigConsumerSlots,
  type ConfigContextSource,
  type ResponsiveMap,
} from "semi-ui-vue";
import ProviderFromSubpath, {
  ConfigProvider as NamedProviderFromSubpath,
  ConfigConsumer as ConsumerFromSubpath,
  useConfigContext as useSubpathContext,
  type ConfigProviderProps as SubpathProviderProps,
  type ConfigConsumerSlots as SubpathConsumerSlots,
  type ConfigContextSource as SubpathContextSource,
} from "semi-ui-vue/configProvider";
const providerIdentity: typeof ConfigProvider = ProviderFromSubpath;
const namedProviderIdentity: typeof ConfigProvider = NamedProviderFromSubpath;
const consumerIdentity: typeof ConfigConsumer = ConsumerFromSubpath;
const configHookIdentity: typeof useConfigContext = useSubpathContext;
const responsiveMap: ResponsiveMap = ConfigProvider.defaultResponsiveMap;
const providerProps: ConfigProviderProps = {
  locale: enUS,
  timeZone: 0,
  direction: "rtl",
  responsiveObserve: true,
  responsiveMap,
  getPopupContainer: () => document.body,
};
const clearProviderProps: ConfigProviderProps = {
  locale: undefined,
  direction: undefined,
  timeZone: undefined,
};
const consumerSlots: ConfigConsumerSlots = {
  default: ({ config }) => {
    const typedSource: ConfigContextSource = config;
    const unsubscribe: (() => void) | undefined = config.value.onBreakpoint?.(
      (screens) => {
        const matched: boolean = screens.md;
        void matched;
      },
    );
    const unsubscribeSelected = config.value.onBreakpoint?.(
      ["xs", "md"],
      (screen, matched) => {
        const breakpoint: "xs" | "sm" | "md" | "lg" | "xl" | "xxl" = screen;
        const matching: boolean = matched;
        void [breakpoint, matching];
      },
    );
    // @ts-expect-error Consumer gives a live readonly ref, not a mutable configuration.
    config.value = typedSource.value;
    // @ts-expect-error Resolved configuration fields are readonly.
    config.value.direction = "ltr";
    // @ts-expect-error Slot configuration is accessed through its live ref value.
    void config.direction;
    void [unsubscribe, unsubscribeSelected];
    return [];
  },
};
const configTypes: readonly true[] = [
  true satisfies Same<ConfigProviderProps, SubpathProviderProps>,
  true satisfies Same<ConfigConsumerSlots, SubpathConsumerSlots>,
  true satisfies Same<ConfigContextSource, SubpathContextSource>,
];
// @ts-expect-error Direction is restricted to the documented modes.
const invalidDirection: ConfigProviderProps = { direction: "auto" };
const invalidContainer: ConfigProviderProps = {
  // @ts-expect-error Container resolvers return an element, not a selector string.
  getPopupContainer: () => "body",
};
// @ts-expect-error The responsive map requires all six named breakpoints.
const invalidResponsiveMap: ResponsiveMap = { xs: "all" };
const invalidResponsiveObserve: ConfigProviderProps = {
  // @ts-expect-error Responsive observation is a boolean opt-in.
  responsiveObserve: "true",
};
void [
  providerIdentity,
  namedProviderIdentity,
  consumerIdentity,
  configHookIdentity,
  providerProps,
  clearProviderProps,
  consumerSlots,
  configTypes,
  invalidDirection,
  invalidContainer,
  invalidResponsiveMap,
  invalidResponsiveObserve,
];

const invalidConfigSlotResult: ConfigConsumerSlots = {
  // @ts-expect-error Native slots must return a renderable block, not raw text.
  default: () => "plain text",
};
void invalidConfigSlotResult;

import {
  LocaleProvider,
  LocaleConsumer,
  type LocaleProviderProps,
  type LocaleConsumerProps,
  type LocaleConsumerSlots,
} from "semi-ui-vue";
import LocaleProviderFromSubpath, {
  LocaleProvider as NamedLocaleProvider,
  type LocaleProviderProps as SubpathLocaleProviderProps,
} from "semi-ui-vue/locale";
import {
  LocaleConsumer as LocaleConsumerFromSubpath,
  type LocaleConsumerProps as SubpathLocaleConsumerProps,
  type LocaleConsumerSlots as SubpathLocaleConsumerSlots,
} from "semi-ui-vue/locale";
const localeProviderIdentity: typeof LocaleProvider = LocaleProviderFromSubpath;
const namedLocaleProviderIdentity: typeof LocaleProvider = NamedLocaleProvider;
const localeConsumerIdentity: typeof LocaleConsumer = LocaleConsumerFromSubpath;
const localeProviderProps: LocaleProviderProps = { locale: enUS };
const defaultLocaleProviderProps: LocaleProviderProps = { locale: undefined };
const localeConsumerProps: LocaleConsumerProps = {
  componentName: "Pagination",
};
const unknownLocaleComponent: LocaleConsumerProps = {
  componentName: "CustomWidget",
};
const defaultLocaleConsumerProps: LocaleConsumerProps = {
  componentName: undefined,
};
const localeConsumerSlots: LocaleConsumerSlots = {
  default: ({ locale }) => {
    const code: string = locale.value.localeCode;
    const currency: string | undefined = locale.value.currency;
    const month = locale.value.dateFnsLocale.localize?.month(0);
    // @ts-expect-error Native Consumer supplies a readonly ref.
    locale.value = locale.value;
    // @ts-expect-error Resolved locale fields cannot be reassigned.
    locale.value.localeCode = "replacement";
    // @ts-expect-error Native Consumer's scope is not a React callback locale dictionary.
    void locale.Pagination;
    void [code, currency, month];
    return [];
  },
};
const modalLocaleSlots: LocaleConsumerSlots<"Modal"> = {
  default: ({ locale }) => {
    const confirm: string | undefined = locale.value.componentLocale?.confirm;
    // @ts-expect-error Known component keys retain their dictionary shape.
    void locale.value.componentLocale?.page;
    void confirm;
    return [];
  },
};
const localeTypes: readonly true[] = [
  true satisfies Same<LocaleProviderProps, SubpathLocaleProviderProps>,
  true satisfies Same<LocaleConsumerProps, SubpathLocaleConsumerProps>,
  true satisfies Same<LocaleConsumerSlots, SubpathLocaleConsumerSlots>,
];
const invalidLocaleProvider: LocaleProviderProps = {
  // @ts-expect-error Public API requires a complete dictionary, not a partial merge request.
  locale: { code: "en-US" },
};
// @ts-expect-error LocaleProvider has no timezone formatting property.
const invalidLocaleZone: LocaleProviderProps = { timeZone: 8 };
// @ts-expect-error Component names are strings, not dictionary objects.
const invalidLocaleName: LocaleConsumerProps = { componentName: enUS };
// @ts-expect-error LocaleProvider does not forward class attributes.
const invalidLocaleClass: LocaleProviderProps = { class: "extra" };
// @ts-expect-error LocaleConsumer does not forward style attributes.
const invalidLocaleStyle: LocaleConsumerProps = { style: {} };
// @ts-expect-error A React children callback is not a native Consumer prop.
const invalidLocaleChildren: LocaleConsumerProps = { children: () => [] };
const invalidLocaleSlot: LocaleConsumerSlots = {
  // @ts-expect-error Native Vapor slots return renderable blocks, not raw text.
  default: () => "plain text",
};
void [
  localeProviderIdentity,
  namedLocaleProviderIdentity,
  localeConsumerIdentity,
  localeProviderProps,
  defaultLocaleProviderProps,
  localeConsumerProps,
  unknownLocaleComponent,
  defaultLocaleConsumerProps,
  localeConsumerSlots,
  modalLocaleSlots,
  localeTypes,
  invalidLocaleProvider,
  invalidLocaleZone,
  invalidLocaleName,
  invalidLocaleClass,
  invalidLocaleStyle,
  invalidLocaleChildren,
  invalidLocaleSlot,
];

import { Spin } from "semi-ui-vue";
import SpinFromSubpath, {
  Spin as NamedSpin,
  type SpinProps,
  type SpinSlots,
  type SpinSize,
} from "semi-ui-vue/spin";
const spinIdentity: typeof Spin = SpinFromSubpath;
const spinNamedIdentity: typeof Spin = NamedSpin;
const spinSize: SpinSize = "large";
const spinProps: SpinProps = {
  size: spinSize,
  delay: undefined,
  spinning: undefined,
  tip: 0,
  wrapperClassName: "packed",
  childStyle: { minHeight: "50px" },
  "aria-label": "Loading",
};
const spinSlots: SpinSlots = {
  default: () => [],
  indicator: () => document.createElement("span"),
  tip: () => document.createTextNode("Loading"),
};
// @ts-expect-error Size follows Spin rather than Icon's size union.
const wrongSpinSize: SpinSize = "default";
// @ts-expect-error React indicator props are replaced by native slots.
const wrongSpinIndicator: SpinProps = { indicator: () => [] };
// @ts-expect-error A slot cannot return raw strings.
const wrongSpinText: SpinSlots = { default: () => "text" };
// @ts-expect-error A slot cannot return raw null.
const wrongSpinNull: SpinSlots = { indicator: () => null };
// @ts-expect-error A slot cannot be async.
const wrongSpinAsync: SpinSlots = { tip: async () => [] };
// @ts-expect-error There is no click event on Spin.
const wrongSpinEvent: SpinProps = { onClick: () => {} };
void [
  spinIdentity,
  spinNamedIdentity,
  spinProps,
  spinSlots,
  wrongSpinSize,
  wrongSpinIndicator,
  wrongSpinText,
  wrongSpinNull,
  wrongSpinAsync,
  wrongSpinEvent,
];

const spinMarker: "Spin" = Spin.__SemiComponentName__;
void spinMarker;

import {
  IconButton,
  type IconButtonProps as RootIconButtonProps,
} from "semi-ui-vue";
import IconButtonFromSubpath, {
  IconButton as NamedIconButton,
  type IconButtonProps,
  type IconButtonSlots,
} from "semi-ui-vue/iconButton";
const iconButtonIdentity: typeof IconButton = IconButtonFromSubpath;
const namedIconButtonIdentity: typeof IconButton = NamedIconButton;
const iconButtonMarker: "IconButton" = IconButton.elementType;
const iconButtonProps: IconButtonProps = {
  type: "primary",
  theme: "borderless",
  size: "default",
  htmlType: "submit",
  text: 0,
  iconPosition: "right",
  noHorizontalPadding: ["left", "right"] as const,
  loading: undefined,
  disabled: undefined,
  block: true,
  circle: true,
  colorful: true,
  className: "consumer-icon-button",
  contentClassName: "consumer-content",
  prefixCls: undefined,
  iconSize: "large",
  iconStyle: { color: "red" },
  name: "action",
  value: "save",
  form: "consumer-form",
  "aria-label": "Save",
  onClick(event) {
    const click: MouseEvent = event;
    void click;
  },
  onMousedown(event) {
    const mouse: MouseEvent = event;
    void mouse;
  },
  onKeydown(event) {
    const keyboard: KeyboardEvent = event;
    void keyboard;
  },
};
const iconButtonSlots: IconButtonSlots = {
  default: () => document.createTextNode("Save"),
  icon: (scope) => {
    const fill: readonly string[] | undefined = scope.fill;
    // @ts-expect-error The color scope is readonly.
    scope.fill = ["red"];
    void fill;
    return [document.createElement("span")];
  },
};
// @ts-expect-error Native button type belongs to htmlType.
const wrongIconButtonType: IconButtonProps = { type: "submit" };
// @ts-expect-error Theme remains a closed upstream union.
const wrongIconButtonTheme: IconButtonProps = { theme: "ghost" };
// @ts-expect-error Size remains a closed upstream union.
const wrongIconButtonSize: IconButtonProps = { size: "mini" };
// @ts-expect-error Native htmlType rejects application actions.
const wrongIconButtonHtmlType: IconButtonProps = { htmlType: "save" };
const wrongIconButtonPadding: IconButtonProps = {
  // @ts-expect-error Padding accepts physical sides only.
  noHorizontalPadding: "start",
};
// @ts-expect-error Icon placement accepts physical positions only.
const wrongIconButtonPosition: IconButtonProps = { iconPosition: "top" };
// @ts-expect-error React icon nodes are replaced by the icon slot.
const wrongIconButtonIcon: IconButtonProps = { icon: () => [] };
// @ts-expect-error React children nodes are replaced by text or the default slot.
const wrongIconButtonChildren: IconButtonProps = { children: "save" };
// @ts-expect-error A default slot must return a native Vapor render result.
const wrongIconButtonTextSlot: IconButtonSlots = { default: () => "save" };
// @ts-expect-error Async rendering is not a native Vapor slot result.
const wrongIconButtonAsyncSlot: IconButtonSlots = { icon: async () => [] };
// @ts-expect-error Loading indicators have no customization slot.
const wrongIconButtonIndicator: IconButtonSlots = { indicator: () => [] };
const wrongIconButtonEvent: IconButtonProps = {
  // @ts-expect-error Native click callbacks cannot receive KeyboardEvent.
  onClick: (event: KeyboardEvent) => event,
};
// @ts-expect-error BaseButton remains private.
import { BaseButton } from "semi-ui-vue";
// @ts-expect-error Public Button is not delivered by IconButton.
import { Button } from "semi-ui-vue";
// @ts-expect-error ButtonGroup remains undelivered.
import { ButtonGroup } from "semi-ui-vue";
// @ts-expect-error SplitButtonGroup remains undelivered.
import { SplitButtonGroup } from "semi-ui-vue";
// @ts-expect-error Private BaseButton has no public subpath.
import BaseButtonFromSubpath from "semi-ui-vue/baseButton";
// @ts-expect-error Future Button has no public subpath.
import ButtonFromSubpath from "semi-ui-vue/button";
void [
  iconButtonIdentity,
  namedIconButtonIdentity,
  iconButtonMarker,
  iconButtonProps,
  iconButtonSlots,
  true satisfies Same<RootIconButtonProps, IconButtonProps>,
  wrongIconButtonType,
  wrongIconButtonTheme,
  wrongIconButtonSize,
  wrongIconButtonHtmlType,
  wrongIconButtonPadding,
  wrongIconButtonPosition,
  wrongIconButtonIcon,
  wrongIconButtonChildren,
  wrongIconButtonTextSlot,
  wrongIconButtonAsyncSlot,
  wrongIconButtonIndicator,
  wrongIconButtonEvent,
  BaseButton,
  Button,
  ButtonGroup,
  SplitButtonGroup,
  BaseButtonFromSubpath,
  ButtonFromSubpath,
];

const iconButtonDisabledValues: IconButtonProps[] = [
  { disabled: false },
  { disabled: true },
  { disabled: undefined },
];
// @ts-expect-error Disabled must remain boolean in shipped declarations.
const iconButtonStringFalse: IconButtonProps = { disabled: "false" };
// @ts-expect-error Boolean strings are not component disabled values.
const iconButtonStringTrue: IconButtonProps = { disabled: "true" };
void [iconButtonDisabledValues, iconButtonStringFalse, iconButtonStringTrue];
