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
