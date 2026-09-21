import { defineVaporComponent } from "vue";
import { setupConvertedIcon } from "./factory-setup.js";
import type { IconHandle, IconProps, IconSlots } from "./types.js";

export type ConvertedIconProps = Omit<IconProps, "type" | "v-slots">;

/** Adapt a SVG slot factory without inspecting or cloning rendered nodes. */
const factory = {
  create(svg: NonNullable<IconSlots["svg"]>, type: string) {
    const ConvertedIcon = defineVaporComponent<
      ConvertedIconProps,
      {},
      string,
      {},
      IconHandle
    >(() => setupConvertedIcon({ svg, type }), { inheritAttrs: false });
    return Object.assign(ConvertedIcon, { elementType: "Icon" as const });
  },
};
export const convertIcon = factory.create;
