import {
  computed,
  createComponent,
  defineVaporComponent,
  nextTick,
  provide,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import Tag from "../../packages/semi-ui-vue/src/components/tag/Tag.js";
import TagGroup from "../../packages/semi-ui-vue/src/components/tag/group.js";
import { tagTriggerKey } from "../../packages/semi-ui-vue/src/components/tag/trigger-context.js";
import {
  ariaIdScopeKey,
  createAriaIdScope,
} from "../../packages/semi-ui-vue/src/dom/aria.js";
import type { TagProps } from "../../packages/semi-ui-vue/src/components/tag/types.js";
import { mountVapor } from "../support/mount-vapor.js";
const settle = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};

test("Tag count private click bridge provides role and Enter once while dynamic hover stays passive", async () => {
  const enabled = shallowRef(true);
  const onClick = shallowRef<TagProps["onClick"]>(undefined);
  const order: string[] = [];
  const bridgeClick = vi.fn((_event: unknown) => {
    order.push("bridge");
  });
  const ownClick = vi.fn((_event: unknown) => {
    order.push("own");
  });
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provide(
        tagTriggerKey,
        computed(() => ({
          attrs: {},
          triggerRef: () => undefined,
          getTriggerRef: () => () => undefined,
          triggerProps: {
            tabIndex: 0,
            "data-popupid": "popup",
            ...(enabled.value ? { onClick: bridgeClick } : {}),
          },
        })),
      );
      return <Tag children="+1" onClick={onClick.value} />;
    }),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-tag")!;
    expect(root.getAttribute("role")).toBe("button");
    const first = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    root.dispatchEvent(first);
    expect(first.defaultPrevented).toBe(true);
    expect(bridgeClick.mock.calls).toEqual([[first]]);
    onClick.value = ownClick;
    await settle();
    order.length = 0;
    const second = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    root.dispatchEvent(second);
    expect(order).toEqual(["bridge", "own"]);
    expect(bridgeClick).toHaveBeenCalledTimes(2);
    expect(ownClick.mock.calls).toEqual([[second]]);
    order.length = 0;
    root.click();
    expect(order).toEqual(["bridge", "own"]);
    expect(bridgeClick).toHaveBeenCalledTimes(3);
    expect(ownClick).toHaveBeenCalledTimes(2);
    enabled.value = false;
    onClick.value = undefined;
    await settle();
    expect(root.getAttribute("role")).toBeNull();
    const passive = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    root.dispatchEvent(passive);
    expect(passive.defaultPrevented).toBe(false);
    expect(bridgeClick).toHaveBeenCalledTimes(3);
  } finally {
    fixture.unmount();
  }
});

test("TagGroup count Enter opens the real click Popover and dynamic trigger removes click semantics", async () => {
  const trigger = shallowRef<"click" | "hover">("click");
  const visible = vi.fn();
  const Content = defineVaporComponent(() => (
    <TagGroup
      maxTagCount={1}
      popoverProps={{
        trigger: trigger.value,
        motion: false,
        onVisibleChange: visible,
      }}
      showPopover
      tagList={[{ children: "a" }, { children: "b" }]}
    />
  ));
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provide(ariaIdScopeKey, createAriaIdScope("tag-keyboard"));
      return createComponent(Content);
    }),
  );
  try {
    await settle();
    const root = fixture.host.querySelectorAll<HTMLElement>(".semi-tag")[1]!;
    expect(root.getAttribute("role")).toBe("button");
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    root.dispatchEvent(event);
    await settle();
    await vi.waitFor(() =>
      expect(root.getAttribute("aria-expanded")).toBe("true"),
    );
    expect(event.defaultPrevented).toBe(true);
    expect(document.querySelector(".semi-popover-content")?.textContent).toBe(
      "b",
    );
    expect(visible).toHaveBeenCalledTimes(1);
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    await settle();
    await vi.waitFor(() =>
      expect(root.getAttribute("aria-expanded")).toBe("false"),
    );
    expect(visible).toHaveBeenCalledTimes(2);
    root.click();
    await settle();
    await vi.waitFor(() =>
      expect(root.getAttribute("aria-expanded")).toBe("true"),
    );
    expect(visible).toHaveBeenCalledTimes(3);
    trigger.value = "hover";
    await settle();
    expect(root.getAttribute("role")).toBeNull();
    const passive = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    root.dispatchEvent(passive);
    await settle();
    expect(passive.defaultPrevented).toBe(false);
    expect(visible).toHaveBeenCalledTimes(3);
  } finally {
    fixture.unmount();
  }
});

test("Tag bridge mouseenter precedes user callback and keydown follows built-in handling before user callback", () => {
  const order: string[] = [];
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provide(
        tagTriggerKey,
        computed(() => ({
          attrs: {},
          triggerRef: () => undefined,
          getTriggerRef: () => () => undefined,
          triggerProps: {
            tabIndex: 0,
            "data-popupid": "events",
            onClick: () => {
              order.push("bridge-click");
            },
            onMouseenter: () => {
              order.push("bridge-enter");
            },
            onKeydown: (event) => {
              order.push(`bridge-key:${event.defaultPrevented}`);
            },
          },
        })),
      );
      return (
        <Tag
          children="events"
          onClick={() => {
            order.push("own-click");
          }}
          onKeyDown={(event) => {
            order.push(`own-key:${event.defaultPrevented}`);
          }}
          onMouseEnter={() => {
            order.push("own-enter");
          }}
        />
      );
    }),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-tag")!;
    root.dispatchEvent(new MouseEvent("mouseenter"));
    expect(order).toEqual(["bridge-enter", "own-enter"]);
    order.length = 0;
    root.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        cancelable: true,
        bubbles: true,
      }),
    );
    expect(order).toEqual([
      "bridge-click",
      "own-click",
      "bridge-key:true",
      "own-key:true",
    ]);
    order.length = 0;
    root.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Other",
        cancelable: true,
        bubbles: true,
      }),
    );
    expect(order).toEqual(["bridge-key:false", "own-key:false"]);
  } finally {
    fixture.unmount();
  }
});
