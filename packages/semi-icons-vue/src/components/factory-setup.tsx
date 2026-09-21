import { ref, useAttrs } from "vue";
import type { VaporRenderResult } from "vue";
import Icon from "./Icon.js";
import type { IconHandle, IconSlots } from "./types.js";

// Called inside each factory component setup; this is native Vapor TSX.
export function setupConvertedIcon(options: {
  svg: NonNullable<IconSlots["svg"]>;
  type: string;
}): VaporRenderResult {
  const attrs = useAttrs();
  const icon = ref<IconHandle | null>(null);
  const api: IconHandle = {
    getElement: () => icon.value?.getElement() ?? null,
  };
  defineExpose<IconHandle>(api);
  return (
    <Icon
      {...attrs}
      ref={icon}
      type={options.type}
      v-slots={{ svg: options.svg }}
    />
  );
}
