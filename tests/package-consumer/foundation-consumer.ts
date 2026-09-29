import { createVaporApp, createApp, vaporInteropPlugin } from "vue";
import {
  FoundationHarness,
  FoundationInput,
  FoundationTooltip,
  Model,
  type FoundationInputProps,
  type FoundationTooltipProps,
} from "@raitosora/semi-validation-foundation";

const input: FoundationInputProps = {
  value: "value",
  "onUpdate:value": (value: string) => void value,
};
const tooltip: FoundationTooltipProps = { content: "content" };
// @ts-expect-error Input values remain strings after packing declarations.
const invalidInput: FoundationInputProps = { value: 12 };
// @ts-expect-error Tooltip content is required in the emitted declaration.
const invalidTooltip: FoundationTooltipProps = {};
void [
  input,
  tooltip,
  invalidInput,
  invalidTooltip,
  FoundationInput,
  FoundationTooltip,
  Model,
];
createVaporApp(FoundationHarness);
createApp(FoundationHarness).use(vaporInteropPlugin);

import type { TooltipProps, TooltipInstance } from "semi-ui-vue/tooltip";
const publicTooltip: TooltipProps = {
  trigger: "click",
  content: () => 0,
  wrapperId: "foundation-public-tooltip",
  motion: false,
};
const invalidPublicContent: TooltipProps = {
  // @ts-expect-error Public Tooltip content stays primitive, unlike owned slots.
  content: () => document.createElement("b"),
};
const publicInstance = null as TooltipInstance | null;
publicInstance?.focusTrigger();
const publicPosition: Record<string, string | number> | undefined =
  publicInstance?.rePosition();
const publicId: string | undefined = publicInstance?.getPopupId();
void [publicPosition, publicId];
void [publicTooltip, invalidPublicContent];

import type { PopoverProps, PopoverInstance } from "semi-ui-vue/popover";
const publicPopover: PopoverProps = {
  trigger: "click",
  content: () => 0,
  motion: false,
};
const invalidPublicPopoverContent: PopoverProps = {
  // @ts-expect-error Public Popover content stays primitive, unlike owned slots.
  content: () => document.createElement("b"),
};
const popoverInstance = null as PopoverInstance | null;
popoverInstance?.focusTrigger();
// @ts-expect-error Popover does not expose Tooltip repositioning.
popoverInstance?.rePosition();
// @ts-expect-error Popover does not expose Tooltip popup IDs.
popoverInstance?.getPopupId();
void [publicPopover, invalidPublicPopoverContent];
