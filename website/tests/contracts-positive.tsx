import { ref } from "vue";
import {
  Protocol,
  ProtocolGroup,
  type ProtocolApi,
  type ProtocolProps,
  type ProtocolSlots,
} from "../examples/contracts/Protocol.vapor";
import { GenericChoice } from "../examples/contracts/Generic.vapor";
const api = ref<ProtocolApi | null>(null);
const slots: ProtocolSlots = {
  default: (slot) => <span>{String(slot.value)}</span>,
};
const props: ProtocolProps = {
  value: undefined,
  beforeChange: async () => false,
};
export const examples = (
  <div>
    <Protocol
      {...props}
      onChange={(value, event) => {
        void value;
        event.preventDefault();
      }}
      ref={api}
      v-slots={slots}
    />
    <ProtocolGroup.Part label="part" />
    <GenericChoice
      items={[1, 2]}
      onSelect={(value) => value.toFixed()}
      value={1}
    />
    <GenericChoice<string>
      items={["a"]}
      onSelect={(value) => value.toUpperCase()}
      value="a"
    />
  </div>
);
api.value?.focus();
api.value?.decide(false);

import ConfigProviderFromPath, {
  ConfigConsumer,
  defaultResponsiveMap,
  type ConfigConsumerSlots,
  type ConfigContextSource,
  type ConfigProviderProps,
} from "semi-ui-vue/configProvider";
const configSlots: ConfigConsumerSlots = {
  default: ({ config }) => <span>{config.value.direction}</span>,
};
const configProps: ConfigProviderProps = {
  direction: undefined,
  timeZone: 0,
  responsiveObserve: true,
  responsiveMap: { ...defaultResponsiveMap, md: "(min-width: 500px)" },
};
export const configExample = (
  <ConfigProviderFromPath {...configProps}>
    {() => <ConfigConsumer v-slots={configSlots} />}
  </ConfigProviderFromPath>
);
export function configSourceTypes(source: ConfigContextSource) {
  const stop = source.value.onBreakpoint?.(["md"], (screen, match) => {
    const key: string = screen;
    const matching: boolean = match;
    void [key, matching];
  });
  stop?.();
}

export const configConsumerShorthand = (
  <ConfigConsumer>
    {({ config }) => <span>{config.value.direction}</span>}
  </ConfigConsumer>
);

// Vue's reserved identity/ref attributes remain available; no public methods
// are promised by the ref callback.
export const configReservedAttributes = (
  <ConfigProviderFromPath key="provider" ref={() => {}}>
    {() => <ConfigConsumer key="consumer" ref={() => {}} />}
  </ConfigProviderFromPath>
);

import {
  LocaleProvider,
  LocaleConsumer,
  type LocaleConsumerSlots,
  type LocaleContextSource,
  type LocaleProviderProps,
} from "semi-ui-vue/locale";
import type { Locale } from "semi-ui-vue/locale/interface";
import enUS from "semi-ui-vue/locale/source/en_US";
const localeProps: LocaleProviderProps = { locale: undefined };
const localeSlots: LocaleConsumerSlots<"Modal"> = {
  default: ({ locale }) => <span>{locale.value.componentLocale?.confirm}</span>,
};
export const localeExample = (
  <LocaleProvider {...localeProps} key="language" ref={() => {}}>
    {() => (
      <LocaleConsumer<"Modal"> componentName="Modal" v-slots={localeSlots} />
    )}
  </LocaleProvider>
);
export const localeInline = (
  <LocaleProvider locale={enUS}>
    {() => (
      <LocaleConsumer<"Modal"> componentName="Modal">
        {({ locale }) => <span>{locale.value.componentLocale?.confirm}</span>}
      </LocaleConsumer>
    )}
  </LocaleProvider>
);
export const localeObjectSlot = (
  <LocaleConsumer<"Modal">
    componentName="Modal"
    v-slots={{
      default: ({ locale }) => (
        <span>{locale.value.componentLocale?.confirm}</span>
      ),
    }}
  />
);
export function localeSourceTypes(source: LocaleContextSource<"Modal">) {
  const dictionary: Locale["Modal"] | undefined = source.value.componentLocale;
  const code: string = source.value.localeCode;
  const currency: string | undefined = source.value.currency;
  void [dictionary, code, currency];
}

import { Spin as RootSpin } from "semi-ui-vue";
import Spin, {
  type SpinProps,
  type SpinSlots,
  type SpinSize,
} from "semi-ui-vue/spin";
const spinSize: SpinSize = "middle";
const spinProps: SpinProps = {
  size: spinSize,
  spinning: undefined,
  delay: undefined,
  tip: undefined,
  childStyle: { minHeight: "50px" },
};
const spinSlots: SpinSlots = {
  default: () => <input />,
  indicator: () => <span>*</span>,
  tip: () => <strong>加载中</strong>,
};
export const spinExample = (
  <Spin
    {...spinProps}
    aria-label="加载"
    class="custom-spin"
    data-test="spin"
    v-slots={spinSlots}
  />
);
export const spinShorthand = (
  <RootSpin>
    {() => (
      <>
        <input />
        <span>content</span>
      </>
    )}
  </RootSpin>
);
export const spinInline = (
  <Spin
    v-slots={{
      default: () => [],
      indicator: () => <svg />,
      tip: () => <span>text</span>,
    }}
  />
);

import { IconButton as RootIconButton } from "semi-ui-vue";
import IconButton, {
  type IconButtonProps,
  type IconButtonSlots,
  type IconButtonIconScope,
  type HorizontalPaddingType,
} from "semi-ui-vue/iconButton";
const iconButtonPadding: readonly HorizontalPaddingType[] = ["left", "right"];
const iconButtonProps: IconButtonProps = {
  text: undefined,
  iconPosition: undefined,
  loading: undefined,
  htmlType: "submit",
  noHorizontalPadding: iconButtonPadding,
  iconStyle: { color: "red" },
  style: [{ paddingLeft: "12px" }, { color: "blue" }],
};
const iconButtonSlots: IconButtonSlots = {
  default: () => <strong>操作</strong>,
  icon: (scope: IconButtonIconScope) => (
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <circle cx="8" cy="8" fill={scope.fill?.[0] ?? "currentColor"} r="6" />
    </svg>
  ),
};
export const iconButtonExample = (
  <IconButton
    {...iconButtonProps}
    aria-label="提交操作"
    contentClassName="content"
    onBlur={(event) => {
      const focusEvent: FocusEvent = event;
      void focusEvent.relatedTarget;
    }}
    onClick={(event) => {
      const pointerEvent: PointerEvent = event;
      pointerEvent.preventDefault();
    }}
    onFocus={(event) => {
      const focusEvent: FocusEvent = event;
      void focusEvent.relatedTarget;
    }}
    onKeydown={(event) => {
      const keyboardEvent: KeyboardEvent = event;
      void keyboardEvent.key;
    }}
    onKeyup={(event) => {
      const keyboardEvent: KeyboardEvent = event;
      void keyboardEvent.code;
    }}
    onMousedown={(event) => {
      const mouseEvent: MouseEvent = event;
      void mouseEvent.button;
    }}
    onMouseenter={(event) => {
      const mouseEvent: MouseEvent = event;
      void mouseEvent.clientX;
    }}
    onMouseleave={(event) => {
      const mouseEvent: MouseEvent = event;
      void mouseEvent.relatedTarget;
    }}
    v-slots={iconButtonSlots}
  />
);
const iconButtonColorful = ref(false);
export const iconButtonDynamicFill = (
  <RootIconButton
    colorful={iconButtonColorful.value}
    text={0}
    theme="light"
    type="tertiary"
    v-slots={{
      icon: (scope) => (
        <svg aria-hidden="true">
          <path d="M0 0H16V16H0Z" fill={scope.fill?.[0] ?? "currentColor"} />
        </svg>
      ),
    }}
  />
);
export const iconButtonShorthand = (
  <RootIconButton>{() => <span>内容</span>}</RootIconButton>
);
export const iconButtonEmpty = (
  <IconButton text={null} v-slots={{ icon: () => [], default: () => <></> }} />
);
const iconButtonMarker: "IconButton" = IconButton.elementType;
void iconButtonMarker;

export const iconButtonConditionalSlot = (
  <IconButton
    v-slots={{
      icon: () => (
        <>
          <svg v-if={iconButtonColorful.value} aria-hidden="true" />
        </>
      ),
    }}
  />
);

export const iconButtonDisabledFalse = <IconButton disabled={false} />;
export const iconButtonDisabledTrue = <IconButton disabled={true} />;
export const iconButtonDisabledUndefined = <IconButton disabled={undefined} />;

import DividerFromPath, {
  type DividerProps,
  type DividerSlots,
} from "semi-ui-vue/divider";
import { Divider } from "semi-ui-vue";
const dividerIdentity: typeof Divider = DividerFromPath;
const dividerProps: DividerProps = {
  align: "left",
  layout: "horizontal",
  margin: 0,
  dashed: false,
  className: "extra",
  class: ["base", { active: true }],
  style: [{ marginTop: "2rem" }, "color: red"],
  role: "separator",
  "aria-orientation": "horizontal",
  onClick: (event) => event.preventDefault(),
};
const dividerSlots: DividerSlots = { default: () => <>章节</> };
export const dividerContracts = (
  <div>
    <Divider {...dividerProps} v-slots={dividerSlots} />
    <DividerFromPath
      align={undefined}
      dashed={undefined}
      layout={undefined}
      margin={undefined}
    >
      {() => <strong>标题</strong>}
    </DividerFromPath>
    <Divider v-slots={{ default: () => [] }} />
  </div>
);
void dividerIdentity;

import SpaceFromPath, {
  type Align,
  type SpaceProps,
  type SpaceSlots,
  type Spacing,
} from "semi-ui-vue/space";
import { Space } from "semi-ui-vue";
const spaceIdentity: typeof Space = SpaceFromPath;
const spaceAlign: Align = "baseline";
const spaceSpacing: Spacing = "loose";
const spaceProps: SpaceProps = {
  align: spaceAlign,
  spacing: [12, spaceSpacing],
  vertical: false,
  wrap: true,
  className: "custom",
  class: ["base", { active: true }],
  style: [{ color: "red" }, "column-gap: 2px"],
};
const spaceSlots: SpaceSlots = {
  default: () => (
    <>
      <span>左</span>
      <span>右</span>
    </>
  ),
};
export const spaceContracts = (
  <div>
    <Space {...spaceProps} v-slots={spaceSlots} />
    <SpaceFromPath
      align={undefined}
      data-space-contract="present"
      spacing={undefined}
      vertical={undefined}
      wrap={undefined}
    >
      {() => <button type="button">操作</button>}
    </SpaceFromPath>
    <Space v-slots={{ default: () => [] }} />
    <Space spacing={[1, 2, 3]} />
  </div>
);
void spaceIdentity;
import { Row, Col } from "semi-ui-vue";
import {
  Row as RowFromGrid,
  Col as ColFromGrid,
  type Breakpoint,
  type Gutter,
  type RowProps,
  type RowSlots,
  type ColProps,
  type ColSize,
  type ColSlots,
} from "semi-ui-vue/grid";
const gridBreakpoint: Breakpoint = "xxl";
const gridGutter: Gutter = { xs: 0, sm: 8, md: 16, lg: 24 };
const gridRowProps: RowProps = {
  type: "flex",
  align: "middle",
  justify: "space-between",
  gutter: [gridGutter, { xs: 0, md: 12 }],
  prefixCls: "semi",
  className: "grid-example",
  "aria-label": "示例栅格",
  id: "grid-contract-row",
};
const gridColSize: ColSize = { span: 8, order: 0, offset: 0, push: 1, pull: 0 };
const gridColProps: ColProps = {
  span: 12,
  order: 0,
  offset: 0,
  push: 0,
  pull: 0,
  xs: 24,
  sm: gridColSize,
  md: { span: 6, offset: 2 },
  lg: 4,
  xl: 3,
  xxl: 2,
  prefixCls: "semi",
  id: "grid-contract-col",
};
const gridRowSlots: RowSlots = {
  default: () => <Col {...gridColProps}>{() => <span>列内容</span>}</Col>,
};
const gridColSlots: ColSlots = {
  default: () => <button type="button">操作</button>,
};
export const gridValuesAndTypes = (
  <>
    <Row {...gridRowProps} v-slots={gridRowSlots} />
    <RowFromGrid gutter={0}>
      {() => <ColFromGrid span={24} v-slots={gridColSlots} />}
    </RowFromGrid>
  </>
);
void gridBreakpoint;

import LayoutFromPath, {
  Layout as NamedLayoutFromPath,
  type BasicLayoutProps,
  type BasicProps,
  type SiderProps,
  type LayoutSlots,
  type SiderSlots,
  type ResponsiveMap,
} from "semi-ui-vue/layout";
import { Layout } from "semi-ui-vue";
const layoutIdentity: typeof Layout = LayoutFromPath;
const namedLayoutIdentity: typeof Layout = NamedLayoutFromPath;
const layoutProps: BasicLayoutProps = {
  hasSider: false,
  prefixCls: "semi-layout",
  tagName: "article",
  className: "example",
  class: ["native", { active: true }],
  style: [{ width: "100%" }, "color: red"],
  "aria-label": "Application layout",
};
const headerProps: BasicProps = { tagName: "header", role: "banner" };
const contentProps: BasicProps = { tagName: "main", role: "main" };
const footerProps: BasicProps = { tagName: "footer", role: "contentinfo" };
const siderProps: SiderProps = {
  breakpoint: ["xs", "md"],
  onBreakpoint: (screen, matches) => {
    const knownScreen: keyof ResponsiveMap = screen;
    const knownMatch: boolean = matches;
    void knownScreen;
    void knownMatch;
  },
  "aria-label": "Navigation",
  role: "navigation",
};
const layoutSlots: LayoutSlots = {
  default: () => <Layout.Header>{() => <span>heading</span>}</Layout.Header>,
};
const siderSlots: SiderSlots = { default: () => <button>item</button> };
export const layoutContracts = (
  <>
    <Layout {...layoutProps} v-slots={layoutSlots} />
    <LayoutFromPath hasSider={undefined} tagName={undefined}>
      {() => (
        <>
          <Layout.Header {...headerProps} />
          <Layout.Sider
            {...siderProps}
            data-sider="contract"
            v-slots={siderSlots}
          />
          <Layout.Content {...contentProps}>
            {() => <span>main</span>}
          </Layout.Content>
          <Layout.Footer {...footerProps} />
        </>
      )}
    </LayoutFromPath>
  </>
);
void layoutIdentity;
void namedLayoutIdentity;

import SkeletonFromPath, {
  Skeleton as NamedSkeletonFromPath,
  type AvatarProps as SkeletonAvatarProps,
  type BasicProps as SkeletonBasicProps,
  type GenericProps as SkeletonGenericProps,
  type ParagraphProps as SkeletonParagraphProps,
  type SkeletonAvatarSize,
  type SkeletonProps,
  type SkeletonSlots,
} from "semi-ui-vue/skeleton";
import { Skeleton } from "semi-ui-vue";
const skeletonIdentity: typeof Skeleton = SkeletonFromPath;
const namedSkeletonIdentity: typeof Skeleton = NamedSkeletonFromPath;
const skeletonProps: SkeletonProps = {
  loading: undefined,
  active: true,
  className: "loading-card",
  class: ["custom", { narrow: true }],
  style: [{ width: "100%" }, "max-width: 20rem"],
  "aria-label": "Loading card",
  "aria-busy": true,
  role: "status",
  id: "loading-card",
};
const skeletonSlots: SkeletonSlots = {
  placeholder: () => <Skeleton.Paragraph rows={2} />,
  default: () => <article>Loaded</article>,
};
const skeletonSize: SkeletonAvatarSize = "default";
const skeletonAvatarProps: SkeletonAvatarProps = {
  size: "extra-extra-small",
  shape: "square",
  prefixCls: "custom-skeleton",
  className: "avatar-block",
  style: { width: 20, height: 20 },
};
const skeletonParagraphProps: SkeletonParagraphProps = {
  rows: 0,
  className: "zero-rows",
};
const skeletonGenericProps: SkeletonGenericProps = { shape: "circle" };
const skeletonBasicProps: SkeletonBasicProps = { type: "title" };
export const skeletonContracts = (
  <>
    <Skeleton {...skeletonProps} v-slots={skeletonSlots} />
    <SkeletonFromPath loading={false}>
      {() => <span>Content</span>}
    </SkeletonFromPath>
    <Skeleton.Avatar {...skeletonAvatarProps} />
    <Skeleton.Title {...skeletonBasicProps} />
    <Skeleton.Button />
    <Skeleton.Image />
    <Skeleton.Paragraph {...skeletonParagraphProps} />
  </>
);
void skeletonIdentity;
void namedSkeletonIdentity;
void skeletonSize;
void skeletonGenericProps;
