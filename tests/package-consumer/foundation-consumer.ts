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
