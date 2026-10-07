import {
  computed,
  defineVaporComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  useSlots,
} from "vue";
import type { JSX } from "vue-jsx";
import Title from "../typography/title.js";
import { EmptyContentView } from "./render.js";
import type { EmptyContent, EmptyProps, EmptySlots } from "./types.js";

const Component = defineVaporComponent<EmptyProps, {}, string, {}>(
  (props: EmptyProps) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const root = ref<HTMLDivElement | null>(null);
    const mode = ref<string | null>(null);
    const imageSlot = computed(() => Boolean(slots.image));
    const darkSlot = computed(() => Boolean(slots.darkModeImage));
    const titleSlot = computed(() => Boolean(slots.title));
    const descriptionSlot = computed(() => Boolean(slots.description));
    const footerSlot = computed(() => Boolean(slots.default));
    const dark = computed(
      () =>
        mode.value === "dark" &&
        (darkSlot.value || Boolean(props.darkModeImage)),
    );
    const hasImageSlot = computed(() =>
      dark.value ? darkSlot.value : imageSlot.value,
    );
    const image = computed(() =>
      dark.value ? props.darkModeImage : props.image,
    );
    const imageKind = computed(() => {
      if (hasImageSlot.value) return "slot";
      const value = image.value;
      if (typeof value === "string") return "url";
      // The source checks the `in` operator before rendering non-string content.
      if (value && "id" in (value as object)) return "symbol";
      return "content";
    });
    const withImage = computed(
      () => imageKind.value !== "content" || Boolean(image.value),
    );
    const layout = computed(() =>
      props.layout === undefined ? "vertical" : props.layout,
    );
    const dataAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(([key]) => key.startsWith("data-")),
      ),
    );
    let disposed = false;
    let observer: MutationObserver | undefined;
    onMounted(() => {
      if (!darkSlot.value && !props.darkModeImage) return;
      const document = root.value!.ownerDocument;
      const body = document.body;
      const update = () => {
        if (!disposed) mode.value = body.getAttribute("theme-mode");
      };
      update();
      const Observer = document.defaultView!.MutationObserver;
      observer = new Observer((mutations) => {
        if (
          mutations.some(
            (mutation) =>
              mutation.type === "attributes" &&
              mutation.attributeName === "theme-mode",
          )
        )
          update();
      });
      observer.observe(body, {
        attributes: true,
        childList: false,
        subtree: false,
      });
    });
    onBeforeUnmount(() => {
      disposed = true;
      observer?.disconnect();
    });
    return (
      <div
        {...dataAttrs.value}
        class={[
          "semi-empty",
          layout.value && `semi-empty-${layout.value}`,
          attrs.class,
          props.className,
        ]}
        ref={root}
        style={props.style}
      >
        <div
          class="semi-empty-image"
          style={props.imageStyle}
          x-semi-prop="image,darkModeImage"
        >
          {imageKind.value === "slot" ? (
            dark.value ? (
              <slot name="darkModeImage" />
            ) : (
              <slot name="image" />
            )
          ) : imageKind.value === "url" ? (
            <img
              alt={
                typeof props.description === "string"
                  ? props.description
                  : "empty"
              }
              src={image.value as string}
            />
          ) : imageKind.value === "symbol" ? (
            <svg aria-hidden="true">
              <use
                {...({
                  "xlink:href": `#${(image.value as { id?: string }).id}`,
                } as JSX.IntrinsicElements["use"] & { "xlink:href": string })}
              />
            </svg>
          ) : (
            <EmptyContentView content={image.value as EmptyContent} />
          )}
        </div>
        <div class="semi-empty-content">
          {titleSlot.value || props.title ? (
            <Title
              className="semi-empty-title"
              heading={withImage.value ? 4 : 6}
              style={withImage.value ? undefined : { fontWeight: 400 }}
              x-semi-prop="title"
            >
              {() => (
                <>
                  {titleSlot.value ? (
                    <slot name="title" />
                  ) : (
                    <EmptyContentView content={props.title} />
                  )}
                </>
              )}
            </Title>
          ) : null}
          {descriptionSlot.value || props.description ? (
            <div class="semi-empty-description" x-semi-prop="description">
              {descriptionSlot.value ? (
                <slot name="description" />
              ) : (
                <EmptyContentView content={props.description} />
              )}
            </div>
          ) : null}
          {footerSlot.value || props.children ? (
            <div class="semi-empty-footer" x-semi-prop="children">
              {footerSlot.value ? (
                <slot />
              ) : (
                <EmptyContentView content={props.children} />
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  },
  {
    props: [
      "layout",
      "imageStyle",
      "title",
      "description",
      "image",
      "darkModeImage",
      "style",
      "className",
      "children",
    ],
    inheritAttrs: false,
  },
);
export const Empty = Component as typeof Component & {
  new (props: EmptyProps): { $props: EmptyProps; $slots: EmptySlots };
};
export default Empty;
