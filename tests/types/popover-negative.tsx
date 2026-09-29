// @ts-expect-error fixed upstream ArrowStyle is not a root export
import type { ArrowStyle as RootArrowStyle } from "../../packages/semi-ui-vue/src/index";
// @ts-expect-error fixed upstream ArrowStyle is not a subpath export
import type { ArrowStyle as SubpathArrowStyle } from "../../packages/semi-ui-vue/src/components/popover/index";
import {
  Popover,
  type PopoverProps,
  type PopoverInstance,
  type PopoverSlots,
  type RenderContentProps,
} from "../../packages/semi-ui-vue/src/components/popover/index";
import { tooltipContentAbort } from "../../packages/semi-ui-vue/src/internal/tooltip/content-boundary";
// @ts-expect-error upstream Popover does not expose wrapperId
const wrapper: PopoverProps = { wrapperId: "private" };
// @ts-expect-error arbitrary render objects are not primitive content
const object: PopoverProps = { content: { text: "unsupported" } };
// @ts-expect-error callback must return a synchronous primitive
const async: PopoverProps = { content: async () => "unsupported" };
// @ts-expect-error title is not a Popover prop
const title: PopoverProps = { title: "invented" };
// @ts-expect-error footer is not a Popover prop
const footer: PopoverProps = { footer: "invented" };
// @ts-expect-error wrapperClassName is a Tooltip prop, not Popover's declared API
const wrapperClass: PopoverProps = { wrapperClassName: "private" };
// @ts-expect-error custom arrow slots are not public Popover API
const slots: PopoverSlots = { arrow: () => <div /> };
// @ts-expect-error showArrow is boolean, not structured content
const arrow: PopoverProps = { showArrow: <div /> };
// @ts-expect-error invalid trigger
const trigger: PopoverProps = { trigger: "mousedown" };
// @ts-expect-error invalid positioning
const position: PopoverProps = { position: "auto" };
// @ts-expect-error CSS keys are not ArrowStyle contract
const color: PopoverProps = { arrowStyle: { color: "red" } };
// @ts-expect-error React children cannot be inferred as native Vapor roots
const children = <Popover children="text" />;
declare const api: PopoverInstance;
// @ts-expect-error Popover's upstream ref has no rePosition
api.rePosition();
// @ts-expect-error Popover's upstream ref has no getPopupId
api.getPopupId();
declare const scope: RenderContentProps;
// @ts-expect-error internal cleanup symbol is not a public content scope capability
scope[tooltipContentAbort]();
void [
  wrapper,
  object,
  async,
  title,
  footer,
  wrapperClass,
  slots,
  arrow,
  trigger,
  position,
  color,
  children,
];

void (0 as unknown as RootArrowStyle);
void (0 as unknown as SubpathArrowStyle);
