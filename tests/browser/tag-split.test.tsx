import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import { For } from "vue-jsx/vapor";
import SplitTagGroup from "../../packages/semi-ui-vue/src/components/tag/splitTagGroup.js";
import { mountVapor } from "../support/mount-vapor.js";
const settle = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};
test("SplitTagGroup decorates only direct roots across fragments, lists, nesting and replacement", async () => {
  const items = shallowRef(["a", "b", "c"]);
  const cls = shallowRef("custom");
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <SplitTagGroup aria-label="connected">
        {() => (
          <>
            text
            <For getKey={(item: string) => item} in={items.value}>
              {(item) => (
                <div class={cls.value} data-item={item.value}>
                  <button>{item.value}</button>
                </div>
              )}
            </For>
            <SplitTagGroup>{() => <div data-nested>inner</div>}</SplitTagGroup>
          </>
        )}
      </SplitTagGroup>
    )),
  );
  try {
    await settle();
    const root = fixture.host.querySelector(".semi-tag-split")!;
    const a = root.querySelector("[data-item=a]")!;
    expect(root.getAttribute("role")).toBe("group");
    expect(root.getAttribute("aria-label")).toBe("connected");
    expect(a.classList.contains("semi-tag-first")).toBe(true);
    expect(a.querySelector("button")!.className).toBe("");
    expect(root.lastElementChild!.classList.contains("semi-tag-last")).toBe(
      true,
    );
    const nested = root.querySelector("[data-nested]")!;
    expect(nested.classList.contains("semi-tag-first")).toBe(true);
    expect(nested.classList.contains("semi-tag-last")).toBe(true);
    cls.value = "updated";
    await settle();
    expect(a.classList.contains("updated")).toBe(true);
    expect(a.classList.contains("semi-tag-first")).toBe(true);
    items.value = ["c", "a"];
    await settle();
    expect(root.children[1]).toBe(a);
    expect(a.classList.contains("semi-tag-first")).toBe(false);
    items.value = [];
    await settle();
    expect(a.classList.contains("semi-tag-first")).toBe(false);
    expect(root.children).toHaveLength(1);
    expect(root.children[0]!.classList.contains("semi-tag-first")).toBe(true);
  } finally {
    fixture.unmount();
  }
});
test("SplitTagGroup disconnects each native observer and clears detached classes", async () => {
  const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
  const shown = shallowRef(true);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <SplitTagGroup v-if={shown.value}>
        {() => <span>single</span>}
      </SplitTagGroup>
    )),
  );
  try {
    await settle();
    const node = fixture.host.querySelector("span")!;
    expect(node.className).toBe("semi-tag-first semi-tag-last");
    shown.value = false;
    await settle();
    expect(disconnect).toHaveBeenCalled();
    expect(node.className).toBe("");
    shown.value = true;
    await settle();
    expect(fixture.host.querySelector("span")!.className).toBe(
      "semi-tag-first semi-tag-last",
    );
  } finally {
    fixture.unmount();
    disconnect.mockRestore();
  }
});

test("SplitTagGroup preserves caller-owned edge classes through reorder and unmount", async () => {
  const order = shallowRef(["a", "b"]);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <SplitTagGroup>
        {() => (
          <For getKey={(key: string) => key} in={order.value}>
            {(key) => (
              <span
                class={
                  key.value === "a"
                    ? "semi-tag-last caller"
                    : "semi-tag-first caller"
                }
                data-id={key.value}
              >
                {key.value}
              </span>
            )}
          </For>
        )}
      </SplitTagGroup>
    )),
  );
  let a: Element;
  let b: Element;
  try {
    await settle();
    a = fixture.host.querySelector("[data-id=a]")!;
    b = fixture.host.querySelector("[data-id=b]")!;
    expect(a.classList.contains("semi-tag-last")).toBe(true);
    expect(b.classList.contains("semi-tag-first")).toBe(true);
    order.value = ["b", "a"];
    await settle();
    expect(a.classList.contains("semi-tag-first")).toBe(false);
    expect(b.classList.contains("semi-tag-last")).toBe(false);
    order.value = ["a", "b"];
    await settle();
    order.value = [];
    await settle();
    expect(a.className).toBe("semi-tag-last caller");
    expect(b.className).toBe("semi-tag-first caller");
  } finally {
    fixture.unmount();
  }
  expect(a!.className).toBe("semi-tag-last caller");
  expect(b!.className).toBe("semi-tag-first caller");
});

test("SplitTagGroup isolates multiple apps and works without a realm MutationObserver", async () => {
  const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
  const first = mountVapor(
    defineVaporComponent(() => (
      <SplitTagGroup>{() => <span>first</span>}</SplitTagGroup>
    )),
  );
  const second = mountVapor(
    defineVaporComponent(() => (
      <SplitTagGroup>{() => <span>second</span>}</SplitTagGroup>
    )),
  );
  try {
    await settle();
    first.unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(second.host.querySelector("span")?.className).toBe(
      "semi-tag-first semi-tag-last",
    );
  } finally {
    second.unmount();
    disconnect.mockRestore();
  }
  const Observer = window.MutationObserver;
  Object.defineProperty(window, "MutationObserver", {
    configurable: true,
    writable: true,
    value: undefined,
  });
  let standalone: ReturnType<typeof mountVapor> | undefined;
  try {
    standalone = mountVapor(
      defineVaporComponent(() => (
        <SplitTagGroup>{() => <span>static</span>}</SplitTagGroup>
      )),
    );
    await settle();
    expect(standalone.host.querySelector("span")?.className).toBe(
      "semi-tag-first semi-tag-last",
    );
  } finally {
    standalone?.unmount();
    Object.defineProperty(window, "MutationObserver", {
      configurable: true,
      writable: true,
      value: Observer,
    });
  }
});

test("SplitTagGroup retains recorded marker ownership through dynamic caller class updates", async () => {
  const order = shallowRef(["a", "b"]);
  const callerClass = shallowRef("initial");
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <SplitTagGroup>
        {() => (
          <For getKey={(key: string) => key} in={order.value}>
            {(key) => (
              <span
                class={
                  key.value === "a"
                    ? callerClass.value
                    : "semi-tag-first caller-owned"
                }
                data-marker-owner={key.value}
              >
                {key.value}
              </span>
            )}
          </For>
        )}
      </SplitTagGroup>
    )),
  );
  try {
    await settle();
    const a = fixture.host.querySelector("[data-marker-owner=a]")!;
    const b = fixture.host.querySelector("[data-marker-owner=b]")!;
    expect(a.className).toBe("initial semi-tag-first");
    expect(b.classList.contains("semi-tag-first")).toBe(true);
    callerClass.value = "updated semi-tag-first";
    await settle();
    expect(a.classList.contains("updated")).toBe(true);
    order.value = ["b", "a"];
    await settle();
    expect(fixture.host.querySelectorAll("span")[1]).toBe(a);
    expect(a.classList.contains("updated")).toBe(true);
    expect(a.classList.contains("semi-tag-first")).toBe(false);
    expect(a.classList.contains("semi-tag-last")).toBe(true);
    expect(b.classList.contains("semi-tag-first")).toBe(true);
    expect(b.classList.contains("semi-tag-last")).toBe(false);
    callerClass.value = "latest";
    await settle();
    expect([...a.classList].sort()).toEqual(["latest", "semi-tag-last"]);
    order.value = [];
    await settle();
    expect(a.className).toBe("latest");
    expect(b.className).toBe("semi-tag-first caller-owned");
  } finally {
    fixture.unmount();
  }
});
