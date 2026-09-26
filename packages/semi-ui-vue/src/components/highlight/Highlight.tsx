import {
  computed,
  createComponent,
  createFor,
  createDynamicComponent,
  createPlainElement,
  createSlot,
  defineVaporComponent,
} from "vue";
import type { ShallowRef } from "vue";
import { findHighlightChunks } from "./chunks.js";
import type { HighlightChunk } from "./chunks.js";
import type { HighlightProps } from "./types.js";

interface MarkProps {
  chunk: HighlightChunk;
  source: HighlightProps;
}

function assertSafeTag(tag: string): void {
  // Unlike React's inert script creation, a native Vapor script executes its
  // text on insertion. Style also consumes text as executable CSS, not text.
  if (/^(script|style)$/i.test(tag)) {
    throw new TypeError(
      "Highlight component does not support script or style tags.",
    );
  }
}

const Mark = defineVaporComponent<MarkProps, {}, string, {}>(
  (props: MarkProps) => {
    const tagName = computed(() => props.source.component || "mark");
    const nativeTag = computed(() => {
      const tag = tagName.value;
      // A tag string must not resolve against the application's components.
      // Cache one private type per current tag; Vue owns replacement/cleanup.
      return defineVaporComponent(
        () =>
          createPlainElement(
            tag,
            {
              class: () =>
                [
                  "semi-highlight-tag",
                  props.source.highlightClassName,
                  props.chunk.className,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .trim(),
              style: () => ({
                ...props.source.highlightStyle,
                ...props.chunk.style,
              }),
            },
            { default: () => createSlot() },
            true,
          ),
        { inheritAttrs: false },
      );
    });
    return createDynamicComponent(
      () => {
        assertSafeTag(tagName.value);
        return nativeTag.value;
      },
      null,
      { default: () => createSlot() },
      1,
    );
  },
  { props: ["chunk", "source"], inheritAttrs: false },
);

const Chunk = defineVaporComponent<MarkProps, {}, string, {}>(
  (props: MarkProps) => (
    <>
      {props.chunk.highlight ? (
        <Mark chunk={props.chunk} source={props.source}>
          {() => (
            <>
              {props.source.sourceString!.slice(
                props.chunk.start,
                props.chunk.end,
              )}
            </>
          )}
        </Mark>
      ) : (
        props.source.sourceString!.slice(props.chunk.start, props.chunk.end)
      )}
    </>
  ),
  { props: ["chunk", "source"], inheritAttrs: false },
);

const Component = defineVaporComponent<HighlightProps, {}, string, {}>(
  (props: HighlightProps) => {
    const chunks = computed(() => findHighlightChunks(props));
    return createFor(
      () => chunks.value,
      (chunk: ShallowRef<HighlightChunk>) =>
        createComponent(Chunk, {
          chunk: () => chunk.value,
          source: () => props,
        }),
      (chunk: HighlightChunk) => chunk.start,
    );
  },
  {
    props: [
      "sourceString",
      "searchWords",
      "component",
      "autoEscape",
      "caseSensitive",
      "highlightClassName",
      "highlightStyle",
    ],
    inheritAttrs: false,
  },
);

export const Highlight = Component as typeof Component & {
  new (props: HighlightProps): { $props: HighlightProps };
};
export default Highlight;
