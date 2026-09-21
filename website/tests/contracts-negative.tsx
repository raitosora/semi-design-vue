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
