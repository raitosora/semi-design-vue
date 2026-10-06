import { createDynamicComponent, createSlot, defineVaporComponent } from "vue";
import type { Block } from "vue";
import { safeTypographyAttrs } from "./input.js";
import type { BaseTypographyProps } from "./types.js";
const Decorations = defineVaporComponent<
  { source: BaseTypographyProps; layer?: number },
  {},
  string,
  {}
>(
  (props: { source: BaseTypographyProps; layer?: number }) => {
    const layers = () =>
      [
        props.source.link && (props.source.disabled ? "span" : "a"),
        props.source.delete && "del",
        props.source.strong && "strong",
        props.source.underline && !props.source.link && "u",
        props.source.code && "code",
        props.source.mark && "mark",
      ].filter(Boolean) as string[];
    return (
      <>
        {layers()[props.layer ?? 0] ? (
          createDynamicComponent(
            () => layers()[props.layer ?? 0],
            {
              $: [
                () =>
                  (props.layer ?? 0) === 0 &&
                  props.source.link !== null &&
                  typeof props.source.link === "object"
                    ? safeTypographyAttrs(props.source.link)
                    : {},
              ],
            },
            {
              default: () =>
                (
                  <Decorations
                    layer={(props.layer ?? 0) + 1}
                    source={props.source}
                  >
                    {() => createSlot()}
                  </Decorations>
                ) as Block,
            },
            1,
          )
        ) : (
          <slot />
        )}
      </>
    );
  },
  { props: ["source", "layer"], inheritAttrs: false },
);
export default Decorations;
