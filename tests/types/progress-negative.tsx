import Progress, {
  type ProgressProps,
  type ProgressSlots,
  type ProgressMotion,
} from "../../packages/semi-ui-vue/src/components/progress/index";
// @ts-expect-error Progress has no upstream status API
const status = <Progress status="success" />;
// @ts-expect-error Progress has no upstream default content API
const children = <Progress>{() => <b>child</b>}</Progress>;
// @ts-expect-error scalar formatter cannot return owned DOM content
const format = <Progress format={() => <b>content</b>} />;
const slot = (
  <Progress
    // @ts-expect-error slot percent is a readonly ref, not a number
    v-slots={{ format: ({ percent }) => <b>{percent.toFixed(0)}</b> }}
  />
);
const readonlySlot: ProgressSlots = {
  format: ({ percent }) => {
    // @ts-expect-error consumers cannot write the scoped percentage
    percent.value = 1;
    return <b>{percent.value}</b>;
  },
};
// @ts-expect-error small/default/large only
const size: ProgressProps = { size: "medium" };
// @ts-expect-error round/square only
const cap: ProgressProps = { strokeLinecap: "butt" };
// @ts-expect-error no invented dashboard type
const type = <Progress type="dashboard" />;
// @ts-expect-error no event forwarding
const click = <Progress onClick={() => {}} />;
void [status, children, format, slot, readonlySlot, size, cap, type, click];

// Upstream Motion accepts these shapes; Record-based opaque inputs do not.
// These are migration limitations, not a blanket strictness improvement.
interface OptionsWithoutIndex {
  state?: string;
  onStart?: () => void;
}
const optionsWithoutIndex: OptionsWithoutIndex = { state: "ready" };
// @ts-expect-error the interface lacks the required string index signature
const interfaceMotion: ProgressMotion = optionsWithoutIndex;
const narrowMotionCallback = (props: { percent: number }) => ({
  duration: props.percent,
});
// @ts-expect-error the opaque callback cannot require a percent property
const narrowMotion: ProgressMotion = narrowMotionCallback;
const interfaceResultCallback = (
  _props: Record<string, unknown>,
): OptionsWithoutIndex => ({ state: "ready" });
// @ts-expect-error callback return interface lacks a string index signature
const interfaceReturnMotion: ProgressMotion = interfaceResultCallback;
void [interfaceMotion, narrowMotion, interfaceReturnMotion];
