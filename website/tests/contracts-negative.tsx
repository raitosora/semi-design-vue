import { ref, type Ref } from "vue";
import {
  Protocol,
  ProtocolGroup,
  type ProtocolApi,
  type ProtocolSlots,
} from "../examples/contracts/Protocol.vapor";
import { GenericChoice } from "../examples/contracts/Generic.vapor";
// @ts-expect-error Unsupported value type.
export const badValue = <Protocol value={{}} />;
// @ts-expect-error The decision hook cannot return an arbitrary string.
export const badDecision = <Protocol beforeChange={() => "yes"} />;
// @ts-expect-error A change notification receives the declared value union and native Event.
export const badChange = <Protocol onChange={(value: Date) => value} />;
// @ts-expect-error A model update carries the value union.
export const badUpdate = <Protocol onUpdate:value={(value: Date) => value} />;
// @ts-expect-error Slot children must be render functions.
export const badSlot = <Protocol>raw child</Protocol>;
const badSlots: ProtocolSlots = {
  // @ts-expect-error Slot props have no missing field.
  default: (slot) => <p>{slot.missing}</p>,
};
// @ts-expect-error Static child requires label.
export const missingLabel = <ProtocolGroup.Part />;
// @ts-expect-error The root type has no invented static child.
export const missingStatic = <ProtocolGroup.Missing />;
export const badGenericValue = (
  // @ts-expect-error T comes from numeric items, value cannot widen it to string.
  <GenericChoice items={[1]} onSelect={() => {}} value="x" />
);
export const badGenericEvent = (
  <GenericChoice<number>
    items={[1]}
    // @ts-expect-error Generic notification preserves numeric T.
    onSelect={(value: string) => value}
    value={1}
  />
);
const invalid = ref<{ missing: true } | null>(null);
// @ts-expect-error Ordinary Ref assignment checks the exposed contract (JSX ref remains loose upstream).
const invalidRef: Ref<ProtocolApi | null> = invalid;
const valid = ref<ProtocolApi | null>(null);
// @ts-expect-error focus returns void.
valid.value?.focus().toFixed();
// @ts-expect-error No public instance $el.
valid.value?.$el;
void [badSlots, invalidRef];
const wrongSlot = (slot: { value: Date }) => <p>{slot.value.getTime()}</p>;
export const invalidJsxSlot = (
  // @ts-expect-error The actual component JSX slot rejects a Date payload contract.
  <Protocol v-slots={{ default: wrongSlot }} />
);

import {
  ConfigProvider,
  ConfigConsumer,
  type ConfigConsumerSlots,
  type ConfigContextSource,
  type ConfigProviderProps,
} from "semi-ui-vue/configProvider";
// @ts-expect-error ConfigProvider only accepts ltr/rtl directions.
export const badConfigDirection = <ConfigProvider direction="sideways" />;
export const badConfigContainer = (
  // @ts-expect-error A popup container must resolve an element, not a selector.
  <ConfigProvider getPopupContainer={() => "body"} />
);
// @ts-expect-error Provider has no DOM className prop.
export const badConfigAttrs = <ConfigProvider className="custom" />;
// @ts-expect-error The stable Provider wrapper does not forward class.
export const badProviderClass = <ConfigProvider class="custom" />;
export const badProviderStyle = (
  // @ts-expect-error The stable Provider wrapper does not forward style.
  <ConfigProvider style={{ display: "contents" }} />
);
// @ts-expect-error Consumer has no DOM root for class fallthrough.
export const badConsumerClass = <ConfigConsumer class="custom" />;
// @ts-expect-error Consumer has no DOM root for style fallthrough.
export const badConsumerStyle = <ConfigConsumer style={{ color: "red" }} />;
const incompleteConfig: ConfigProviderProps = {
  // @ts-expect-error Responsive map requires all six named breakpoints.
  responsiveMap: { md: "(min-width: 500px)" },
};
const invalidConfigSlots: ConfigConsumerSlots = {
  // @ts-expect-error Consumer supplies a readonly Ref, not React context callback fields.
  default: ({ direction }: { direction: string }) => <span>{direction}</span>,
};
export const invalidConfigChild = (
  // @ts-expect-error Consumer children are a scoped render function.
  <ConfigConsumer>static child</ConfigConsumer>
);
export function rejectConfigMutation(source: ConfigContextSource) {
  // @ts-expect-error The context value is readonly.
  source.value.direction = "rtl";
  // @ts-expect-error The context source is readonly.
  source.value = source.value;
  // @ts-expect-error Only the six declared breakpoint names are accepted.
  source.value.onBreakpoint?.(["mobile"], () => {});
}
void [incompleteConfig, invalidConfigSlots];

export const configConsumerInlineSlotNegative = (
  <ConfigConsumer
    v-slots={{
      default: ({ config }) => {
        // @ts-expect-error Native Consumer slot retains the typed readonly source.
        config.value.direction = "rtl";
        // @ts-expect-error Unknown context properties cannot silently become any.
        return <span>{config.value.unknownSetting}</span>;
      },
    }}
  />
);

export const invalidConfigConsumerShorthand = (
  <ConfigConsumer>
    {({ config }) => {
      // @ts-expect-error Shorthand scope retains its exact configuration type.
      return <span>{config.value.unknownSetting}</span>;
    }}
  </ConfigConsumer>
);

export const invalidConfigProviderSlotResult = (
  // @ts-expect-error Native slots require JSX/blocks; wrap text in a native element.
  <ConfigProvider>{() => "plain text"}</ConfigProvider>
);
export const invalidConfigConsumerSlotResult: ConfigConsumerSlots = {
  // @ts-expect-error Null is not a native Vapor block; use an empty fragment/array.
  default: () => null,
};

export const invalidConfigConsumerDirectSlotResult = (
  // @ts-expect-error Native Consumer slots cannot render raw string results.
  <ConfigConsumer v-slots={{ default: () => "plain text" }} />
);

import {
  LocaleProvider,
  LocaleConsumer,
  type LocaleContextSource,
  type LocaleConsumerSlots,
} from "semi-ui-vue/locale";
// @ts-expect-error LocaleProvider accepts the full generated locale interface.
export const partialLocale = <LocaleProvider locale={{ code: "en-US" }} />;
// @ts-expect-error No timezone prop on LocaleProvider.
export const localeZone = <LocaleProvider timeZone={8} />;
// @ts-expect-error LocaleProvider has no DOM root or class fallthrough.
export const localeClass = <LocaleProvider class="language" />;
// @ts-expect-error LocaleProvider has no style fallthrough.
export const localeStyle = <LocaleProvider style={{ color: "red" }} />;
// @ts-expect-error No direction prop on LocaleProvider.
export const localeDirection = <LocaleProvider direction="rtl" />;
// @ts-expect-error LocaleConsumer does not forward class.
export const localeConsumerClass = <LocaleConsumer class="language" />;
// @ts-expect-error LocaleConsumer does not forward style.
export const localeConsumerStyle = <LocaleConsumer style={{ color: "red" }} />;
// @ts-expect-error Component name is a string.
export const localeName = <LocaleConsumer componentName={1} />;
// @ts-expect-error Native slots require a block rather than a raw string.
export const localeText = <LocaleProvider>{() => "text"}</LocaleProvider>;
export const localeConsumerText = (
  // @ts-expect-error Native slots require a block rather than a raw string.
  <LocaleConsumer v-slots={{ default: () => "text" }} />
);
export const localeNull: LocaleConsumerSlots = {
  // @ts-expect-error Empty native slots use a fragment rather than null.
  default: () => null,
};
export function rejectLocaleMutation(source: LocaleContextSource) {
  // @ts-expect-error The source Ref is readonly.
  source.value = source.value;
  // @ts-expect-error The selected metadata snapshot is readonly.
  source.value.localeCode = "en-US";
}
export const localeInlineNegative = (
  <LocaleConsumer<"Modal">
    componentName="Modal"
    v-slots={{
      default: ({ locale }) => {
        // @ts-expect-error Generic component dictionary does not become any.
        const wrong: number = locale.value.componentLocale?.confirm;
        // @ts-expect-error Snapshot remains readonly in the actual JSX slot.
        locale.value.currency = "USD";
        return <span>{wrong}</span>;
      },
    }}
  />
);
export const localeShorthandNegative = (
  <LocaleConsumer<"Modal"> componentName="Modal">
    {({ locale }) => {
      // @ts-expect-error Missing dictionary fields retain the supplied generic contract.
      return <span>{locale.value.componentLocale?.unknownField}</span>;
    }}
  </LocaleConsumer>
);

export const localeUnknownDictionary = (
  <LocaleConsumer componentName="Modal">
    {({ locale }) => {
      // @ts-expect-error Without the explicit key generic the dictionary is unknown.
      return <span>{locale.value.componentLocale?.confirm}</span>;
    }}
  </LocaleConsumer>
);
export const localeMismatchedKey = (
  // @ts-expect-error Explicit key generic constrains the selected field.
  <LocaleConsumer<"Modal"> componentName="Pagination" />
);

import { Spin, type SpinSlots, type SpinProps } from "semi-ui-vue/spin";
// @ts-expect-error Spin has three fixed sizes.
export const spinInvalidSize = <Spin size="default" />;
// @ts-expect-error Delays are milliseconds, not strings.
export const spinInvalidDelay = <Spin delay="100" />;
// @ts-expect-error Loading is boolean, not a render callback.
export const spinInvalidState = <Spin spinning={() => true} />;
// @ts-expect-error Native Vapor custom indicators use slots, not React nodes.
export const spinNode = <Spin indicator={<svg />} />;
// @ts-expect-error Spin does not accept a Button loading alias.
export const spinLoading = <Spin loading />;
// @ts-expect-error React className is not an alias for wrapperClassName.
export const spinClassName = <Spin className="wrong" />;
// @ts-expect-error Spin does not expose a click event.
export const spinClick = <Spin onClick={() => {}} />;
// @ts-expect-error Raw text is not a Vapor slot result.
export const spinText = <Spin>{() => "text"}</Spin>;
// @ts-expect-error Raw null is not a Vapor slot result.
export const spinNull = <Spin v-slots={{ indicator: () => null }} />;
// @ts-expect-error Async slot results are unsupported.
export const spinAsync: SpinSlots = { tip: async () => [] };
// @ts-expect-error tip prop is text; rich content uses its native named slot.
export const spinTip: SpinProps = { tip: <span>text</span> };
// @ts-expect-error DOM children are expressed as slots.
export const spinChildren: SpinProps = { children: <input /> };

import { semiGlobal } from "semi-ui-vue";
export function spinDefaultBoundary() {
  semiGlobal.configure({
    // @ts-expect-error Global Spin defaults exclude instance slots and attributes.
    overrideDefaultProps: { Spin: { "aria-label": "global" } },
  });
}

import IconButton, {
  type IconButtonSlots,
  type IconButtonIconScope,
  type IconButtonProps,
} from "semi-ui-vue/iconButton";
import { Button, type ButtonProps } from "semi-ui-vue";
// @ts-expect-error BaseButton is a private implementation, not a root export.
import { BaseButton as PrivateBaseButton } from "semi-ui-vue";
// @ts-expect-error The IconButton entry does not export its private BaseButton.
import { BaseButton as PrivatePathBaseButton } from "semi-ui-vue/iconButton";
// @ts-expect-error The private BaseButton does not have a public package subpath.
import PrivateBaseButtonPath from "semi-ui-vue/BaseButton";
void [Button, PrivateBaseButton, PrivatePathBaseButton, PrivateBaseButtonPath];
// @ts-expect-error Button content is expressed with a native Vapor slot, not children.
export const buttonRawChildren: ButtonProps = { children: <span /> };
// @ts-expect-error Button icon content is expressed with a native Vapor icon slot.
export const buttonNode: ButtonProps = { icon: <svg /> };
export function buttonGlobalSlotBoundary() {
  semiGlobal.configure({
    overrideDefaultProps: {
      Button: {
        // @ts-expect-error Global Button defaults exclude native slots.
        "v-slots": { default: () => <span /> },
      },
    },
  });
}
// @ts-expect-error React event casing is not the native Vue event name.
export const iconButtonReactMouse = <IconButton onMouseDown={() => {}} />;
// @ts-expect-error React event casing is not the native Vue event name.
export const iconButtonReactKey = <IconButton onKeyDown={() => {}} />;
export const iconButtonWrongClick = (
  // @ts-expect-error Click receives PointerEvent, not KeyboardEvent.
  <IconButton onClick={(event: KeyboardEvent) => event.key} />
);
export const iconButtonWrongKey = (
  // @ts-expect-error Keydown receives KeyboardEvent, not MouseEvent.
  <IconButton onKeydown={(event: MouseEvent) => event.button} />
);
// @ts-expect-error Icon nodes use a native icon slot.
export const iconButtonNode = <IconButton icon={<svg />} />;
// @ts-expect-error Raw children nodes are unsupported.
export const iconButtonRawChildren: IconButtonProps = { children: <span /> };
export const iconButtonStyleArray: IconButtonProps = {
  // @ts-expect-error iconStyle is a CSSProperties object, not Vue StyleValue arrays.
  iconStyle: [{ color: "red" }],
};
// @ts-expect-error htmlType and visual type have distinct contracts.
export const iconButtonHtmlType = <IconButton htmlType="primary" />;
// @ts-expect-error type is the visual kind, not a native submit type.
export const iconButtonVisualType = <IconButton type="submit" />;
export const iconButtonIndicator = (
  // @ts-expect-error A loading indicator slot is not part of IconButton's contract.
  <IconButton v-slots={{ indicator: () => <svg /> }} />
);
export const iconButtonUnknownSlot: IconButtonSlots = {
  // @ts-expect-error Named suffix slots are not part of IconButton's contract.
  suffix: () => <span />,
};
// @ts-expect-error Slots cannot directly return raw text.
export const iconButtonString = <IconButton v-slots={{ icon: () => "icon" }} />;
// @ts-expect-error Slots cannot directly return null.
export const iconButtonNull = <IconButton v-slots={{ default: () => null }} />;
// @ts-expect-error Slots cannot directly return undefined.
export const iconButtonUndefined: IconButtonSlots = { icon: () => undefined };
// @ts-expect-error Async slot results are unsupported.
export const iconButtonPromise: IconButtonSlots = { default: async () => [] };
// @ts-expect-error Shorthand slots must return VaporRenderResult rather than text.
export const iconButtonShorthandText = <IconButton>{() => "text"}</IconButton>;
export function iconButtonReadonlyScope(scope: IconButtonIconScope) {
  // @ts-expect-error Slot scope is readonly.
  scope.fill = [];
  // @ts-expect-error Color channels remain readonly.
  scope.fill?.push("red");
}
export const iconButtonTypedScope = (
  <IconButton
    v-slots={{
      icon: (scope) => {
        // @ts-expect-error Inline JSX slots do not erase scope typing.
        const wrong: number = scope.fill?.[0];
        return <span>{wrong}</span>;
      },
    }}
  />
);
export function iconButtonGlobalBoundary() {
  semiGlobal.configure({
    // @ts-expect-error IconButton has no global default-props integration.
    overrideDefaultProps: { IconButton: { loading: true } },
  });
}
// @ts-expect-error No public group is attached to IconButton.
export const iconButtonGroup = <IconButton.Group />;
// @ts-expect-error IconButton exposes no component-level focus method.
IconButton.focus();

// @ts-expect-error Disabled follows the upstream boolean contract.
export const iconButtonStringFalse = <IconButton disabled="false" />;
// @ts-expect-error Boolean strings are not component disabled values.
export const iconButtonStringTrue = <IconButton disabled="true" />;

import { Divider } from "semi-ui-vue";
import type { DividerProps, DividerSlots } from "semi-ui-vue/divider";
// @ts-expect-error Root preserves the fixed upstream value-only surface.
import type { DividerProps as RootDividerProps } from "semi-ui-vue";
// @ts-expect-error Direction uses layout, not invented orientation props.
export const dividerOrientation = <Divider orientation="vertical" />;
// @ts-expect-error Only fixed align values are accepted.
export const dividerAlign = <Divider align="start" />;
// @ts-expect-error Only fixed layout values are accepted.
export const dividerLayout = <Divider layout="row" />;
// @ts-expect-error Margin does not accept arrays.
export const dividerMargin = <Divider margin={[1, 2]} />;
// @ts-expect-error Dashed is boolean, not a boolean string.
export const dividerDashed = <Divider dashed="false" />;
// @ts-expect-error Native slot replaces React children.
export const dividerChildren = <Divider children="text" />;
// @ts-expect-error No scalar text prop is introduced.
export const dividerText = <Divider text="text" />;
// @ts-expect-error Raw text is not a native Vapor slot return value.
export const dividerRawSlot = <Divider>{() => "text"}</Divider>;
// @ts-expect-error Slots cannot return a Promise.
export const dividerAsyncSlot: DividerSlots = { default: async () => [] };
// @ts-expect-error Null is not a native Vapor slot return value.
export const dividerNullSlot: DividerSlots = { default: () => null };
// @ts-expect-error DOM replacement cannot overwrite owned slot content.
export const dividerInnerHTML: DividerProps = { innerHTML: "<b>x</b>" };
// @ts-expect-error DOM replacement cannot overwrite owned slot content.
export const dividerTextContent: DividerProps = { textContent: "x" };
// @ts-expect-error No static Group exists upstream.
export const dividerGroup = <Divider.Group />;
// @ts-expect-error No imperative handle exists.
Divider.focus();
// @ts-expect-error No upstream component marker exists.
Divider.__SemiComponentName__;
export function dividerGlobalBoundary() {
  semiGlobal.configure({
    // @ts-expect-error Divider does not read global defaults.
    overrideDefaultProps: { Divider: { dashed: true } },
  });
}

import { Space } from "semi-ui-vue";
import type { SpaceProps, SpaceSlots } from "semi-ui-vue/space";
// @ts-expect-error Root preserves the fixed upstream value-only surface.
import type { SpaceProps as RootSpaceProps } from "semi-ui-vue";
// @ts-expect-error Align has four fixed values.
export const spaceAlign = <Space align="left" />;
// @ts-expect-error Spacing presets are fixed.
export const spaceSpacing = <Space spacing="compact" />;
// @ts-expect-error Vertical is boolean.
export const spaceVertical = <Space vertical="true" />;
// @ts-expect-error Native slot replaces React children.
export const spaceChildren = <Space children={<span />} />;
// @ts-expect-error No invented direction prop.
export const spaceDirection = <Space direction="vertical" />;
// @ts-expect-error Raw text cannot be a native Vapor slot result.
export const spaceRawSlot = <Space>{() => "text"}</Space>;
// @ts-expect-error Async slots are unsupported.
export const spaceAsyncSlot: SpaceSlots = { default: async () => [] };
// @ts-expect-error Null is not a native Vapor slot result.
export const spaceNullSlot: SpaceSlots = { default: () => null };
// @ts-expect-error DOM replacement cannot overwrite slot ownership.
export const spaceInnerHTML: SpaceProps = { innerHTML: "<b>x</b>" };
// @ts-expect-error No static Group is exported.
export const spaceGroup = <Space.Group />;
// @ts-expect-error No imperative focus method is exported.
Space.focus();
export function spaceGlobalBoundary() {
  semiGlobal.configure({
    // @ts-expect-error Space does not read global defaults.
    overrideDefaultProps: { Space: { spacing: "loose" } },
  });
}
import { Row, Col } from "semi-ui-vue";
import type {
  RowProps,
  RowSlots,
  ColProps,
  ColSlots,
  ColSize,
} from "semi-ui-vue/grid";
// @ts-expect-error Root exports component values, with types on the grid subpath.
import type { RowProps as RootRowProps } from "semi-ui-vue";
// @ts-expect-error Grid has no custom layout mode.
export const gridBadType = <Row type="inline" />;
// @ts-expect-error Align uses top/middle/bottom.
export const gridBadAlign = <Row align="center" />;
// @ts-expect-error Justify has the fixed upstream choices.
export const gridBadJustify = <Row justify="stretch" />;
// @ts-expect-error Gutter numbers and breakpoint maps cannot include CSS strings.
export const gridBadGutter = <Row gutter="16px" />;
// @ts-expect-error Gutter breakpoint keys are fixed.
export const gridBadBreakpoint: RowProps = { gutter: { tablet: 16 } };
// @ts-expect-error Span is numeric.
export const gridBadSpan = <Col span="12" />;
// @ts-expect-error Responsive Col objects use only the supported fields.
export const gridBadColSize: ColSize = { width: 12 };
// @ts-expect-error A responsive size is a number or ColSize.
export const gridBadResponsive = <Col sm="12" />;
// @ts-expect-error No generic columns API exists.
export const gridBadColumns = <Row columns={12} />;
// @ts-expect-error Native slot replaces React children.
export const gridBadChildren = <Row children={<div />} />;
// @ts-expect-error Raw text cannot be a native Vapor slot result.
export const gridBadRawSlot = <Col>{() => "text"}</Col>;
// @ts-expect-error Promise slots are unsupported.
export const gridBadAsyncSlot: RowSlots = { default: async () => [] };
// @ts-expect-error Null cannot be a native Vapor slot result.
export const gridBadNullSlot: ColSlots = { default: () => null };
// @ts-expect-error HTML replacement cannot overwrite owned slot content.
export const gridBadInnerHTML: RowProps = { innerHTML: "<b>x</b>" };
// @ts-expect-error HTML replacement cannot overwrite owned slot content.
export const gridBadTextContent: ColProps = { textContent: "x" };
// @ts-expect-error Row has no static Col API.
export const gridBadStatic = <Row.Col />;
// @ts-expect-error Col has no imperative focus API.
Col.focus();

import { Layout } from "semi-ui-vue";
import type {
  BasicLayoutProps,
  BasicProps,
  SiderProps,
  LayoutSlots,
  SiderSlots,
} from "semi-ui-vue/layout";
// @ts-expect-error The root publishes the Layout value only, not its subcomponent value.
import { Header } from "semi-ui-vue";
// @ts-expect-error Public layout types are available from the layout subpath.
import type { BasicLayoutProps as RootBasicLayoutProps } from "semi-ui-vue";
// @ts-expect-error hasSider uses a boolean, not a string.
export const layoutStringHasSider = <Layout hasSider="false" />;
export const layoutUnknownTag: BasicLayoutProps = {
  // @ts-expect-error tagName is a native HTML tag.
  tagName: "unknown-layout-tag",
};
// @ts-expect-error No collapse state is part of the fixed upstream Layout contract.
export const layoutCollapsed = <Layout collapsed />;
// @ts-expect-error Native slot replaces React children.
export const layoutRawChildren = <Layout children={<span />} />;
// @ts-expect-error DOM replacement must not overwrite owned slot content.
export const layoutInnerHTML: BasicLayoutProps = { innerHTML: "<b>bad</b>" };
// @ts-expect-error DOM replacement must not overwrite owned slot content.
export const layoutTextContent: BasicProps = { textContent: "bad" };
// @ts-expect-error Native slots cannot return plain strings.
export const layoutTextSlot: LayoutSlots = { default: () => "body" };
// @ts-expect-error Native slots cannot return null.
export const layoutNullSlot: SiderSlots = { default: () => null };
// @ts-expect-error Native slots cannot return promises.
export const layoutAsyncSlot: LayoutSlots = { default: async () => [] };
// @ts-expect-error Unknown breakpoint names are rejected.
export const siderBadBreakpoint: SiderProps = { breakpoint: ["tablet"] };
// @ts-expect-error No collapsible trigger is part of the fixed upstream Sider contract.
export const siderTrigger = <Layout.Sider trigger="menu" />;
// @ts-expect-error Native slot replaces React children.
export const siderRawChildren = <Layout.Sider children={<span />} />;
export const siderBadCallback: SiderProps = {
  // @ts-expect-error Callback matches flag is boolean.
  onBreakpoint: (_screen, matches: string) => {
    void matches;
  },
};
// @ts-expect-error Sider filters native id at runtime rather than forwarding it.
export const siderNativeId: SiderProps = { id: "not-forwarded" };
// @ts-expect-error Sider filters native title at runtime rather than forwarding it.
export const siderNativeTitle: SiderProps = { title: "not-forwarded" };
// @ts-expect-error Sider filters native click listeners at runtime.
export const siderNativeClick: SiderProps = { onClick: () => {} };

import { Skeleton } from "semi-ui-vue";
import type {
  AvatarProps as SkeletonAvatarProps,
  ParagraphProps as SkeletonParagraphProps,
  SkeletonProps,
  SkeletonSlots,
} from "semi-ui-vue/skeleton";
// @ts-expect-error Static Avatar is only a Skeleton member, not a root export.
import { Avatar } from "semi-ui-vue";
// @ts-expect-error Skeleton types belong to the skeleton subpath.
import type { SkeletonProps as RootSkeletonProps } from "semi-ui-vue";
// @ts-expect-error Loading is boolean, not a string.
export const skeletonBadLoading = <Skeleton loading="true" />;
// @ts-expect-error Active is boolean, not an animation name.
export const skeletonBadActive = <Skeleton active="pulse" />;
// @ts-expect-error The named Vapor slot replaces the ReactNode placeholder prop.
export const skeletonRawPlaceholder = <Skeleton placeholder={<span />} />;
// @ts-expect-error The default Vapor slot replaces the ReactNode children prop.
export const skeletonRawChildren = <Skeleton children={<span />} />;
// @ts-expect-error Placeholder slot cannot return raw text.
export const skeletonTextSlot: SkeletonSlots = { placeholder: () => "loading" };
// @ts-expect-error Default slot cannot return null.
export const skeletonNullSlot: SkeletonSlots = { default: () => null };
// @ts-expect-error Async slot results are unsupported.
export const skeletonAsyncSlot: SkeletonSlots = { default: async () => [] };
// @ts-expect-error DOM replacement cannot overwrite owned slot content.
export const skeletonInnerHTML: SkeletonProps = { innerHTML: "<b>unsafe</b>" };
// @ts-expect-error DOM replacement cannot overwrite owned slot content.
export const skeletonTextContent: SkeletonProps = { textContent: "unsafe" };
// @ts-expect-error Shape is limited to fixed upstream values.
export const skeletonBadShape: SkeletonAvatarProps = { shape: "triangle" };
// @ts-expect-error Avatar size is a fixed upstream enum.
export const skeletonBadSize = <Skeleton.Avatar size="huge" />;
// @ts-expect-error Paragraph rows is numeric.
export const skeletonBadRows: SkeletonParagraphProps = { rows: "3" };
// @ts-expect-error Paragraph has no loading state.
export const skeletonParagraphLoading = <Skeleton.Paragraph loading />;
// @ts-expect-error Skeleton does not provide a progress percentage.
export const skeletonProgress = <Skeleton percent={20} />;

import { Progress } from "semi-ui-vue";
import type { ProgressProps, ProgressSlots } from "semi-ui-vue/progress";
// @ts-expect-error Root preserves the value-only upstream export.
import type { ProgressProps as RootProgressProps } from "semi-ui-vue";
// @ts-expect-error No upstream status API exists.
export const progressStatus = <Progress status="success" />;
// @ts-expect-error Type is line or circle.
export const progressType = <Progress type="dashboard" />;
export const progressNodeFormat = (
  // @ts-expect-error Scalar format does not take ownership of JSX content.
  <Progress format={() => <strong>完成</strong>} />
);
// @ts-expect-error Progress has no default slot.
export const progressDefaultSlot = <Progress>{() => <span />}</Progress>;
// @ts-expect-error Slot results must be native Vapor blocks.
export const progressTextSlot: ProgressSlots = { format: () => "完成" };
// @ts-expect-error Async format slots are unsupported.
export const progressAsyncSlot: ProgressSlots = { format: async () => [] };
// @ts-expect-error Root content replacement is prohibited.
export const progressHTML: ProgressProps = { innerHTML: "<b>x</b>" };
export const progressReadonly = (
  <Progress
    v-slots={{
      format: ({ percent }) => {
        // @ts-expect-error The displayed percentage is readonly.
        percent.value = 30;
        return <span>{percent.value}</span>;
      },
    }}
  />
);
