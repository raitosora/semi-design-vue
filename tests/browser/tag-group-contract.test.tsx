import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import TagGroup from "../../packages/semi-ui-vue/src/components/tag/group.js";
import type { TagProps } from "../../packages/semi-ui-vue/src/components/tag/types.js";
import { mountVapor } from "../support/mount-vapor.js";
const settle = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};

test("TagGroup preserves keyed identity through reorder and closes in item then group order", async () => {
  const order: string[] = [];
  const items = shallowRef<TagProps[]>(
    ["a", "b", "c"].map((tagKey) => ({
      tagKey,
      children: tagKey,
      closable: true,
      onClose: (_child, event) => {
        order.push(tagKey);
        event.preventDefault();
      },
    })),
  );
  const group = vi.fn((_child, event: Event) => {
    order.push(`group:${event.defaultPrevented}`);
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <TagGroup onTagClose={group} tagList={items.value} />
    )),
  );
  try {
    await settle();
    const first = fixture.host.querySelector(".semi-tag")!;
    items.value = [items.value[2]!, items.value[0]!, items.value[1]!];
    await settle();
    expect(fixture.host.querySelectorAll(".semi-tag")[1]).toBe(first);
    first.querySelector<HTMLElement>(".semi-tag-close")!.click();
    expect(order).toEqual(["a", "group:true"]);
    expect(first.isConnected).toBe(true);
    expect(group).toHaveBeenCalledTimes(1);
  } finally {
    fixture.unmount();
  }
});

test("TagGroup exact count slicing and restCount truthiness preserve boundary semantics", async () => {
  const limit = shallowRef<number | undefined>(1);
  const rest = shallowRef<number | undefined>(undefined);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <TagGroup
        maxTagCount={limit.value}
        restCount={rest.value}
        tagList={[{ children: "a" }, { children: "b" }, { children: "c" }]}
      />
    )),
  );
  try {
    await settle();
    expect(fixture.host.textContent).toBe("a+2");
    rest.value = -1;
    await settle();
    expect(fixture.host.textContent).toBe("abc");
    rest.value = 0;
    limit.value = 0;
    await settle();
    expect(fixture.host.textContent).toBe("+3");
    limit.value = -1;
    await settle();
    expect(fixture.host.textContent).toBe("ab+4");
    limit.value = 1.5;
    await settle();
    expect(fixture.host.textContent).toBe("a+1.5");
    limit.value = NaN;
    await settle();
    expect(fixture.host.textContent).toBe("abc");
    limit.value = Infinity;
    await settle();
    expect(fixture.host.textContent).toBe("abc");
    limit.value = undefined;
    await settle();
    expect(fixture.host.textContent).toBe("abc");
  } finally {
    fixture.unmount();
  }
});

test("TagGroup caller closes middle, last and first records without reusing stale nodes", async () => {
  const items = shallowRef<TagProps[]>(
    ["a", "b", "c", "d"].map((key) => ({
      tagKey: key,
      children: key,
      closable: true,
    })),
  );
  const calls: unknown[] = [];
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <TagGroup
        onTagClose={(_children, _event, key) => {
          calls.push(key);
          items.value = items.value.filter((item) => item.tagKey !== key);
        }}
        tagList={items.value}
      />
    )),
  );
  try {
    await settle();
    const nodes = [...fixture.host.querySelectorAll<HTMLElement>(".semi-tag")];
    for (const key of ["b", "d", "a", "c"]) {
      const index = ["a", "b", "c", "d"].indexOf(key);
      const close =
        nodes[index]!.querySelector<HTMLElement>(".semi-tag-close")!;
      close.click();
      await settle();
      expect(nodes[index]!.isConnected).toBe(false);
      close.click();
      await settle();
      expect(calls).toHaveLength(4 - items.value.length);
      for (const item of items.value)
        expect(
          fixture.host.querySelectorAll(".semi-tag")[items.value.indexOf(item)],
        ).toBe(nodes[["a", "b", "c", "d"].indexOf(String(item.tagKey))]);
    }
    expect(calls).toEqual(["b", "d", "a", "c"]);
  } finally {
    fixture.unmount();
  }
});

test("TagGroup snapshots group callbacks before an item close synchronously replaces them", async () => {
  const order: string[] = [];
  const replacement = (_children: unknown, event: Event) =>
    order.push(`replacement:${event.defaultPrevented}`);
  const callback = shallowRef((_children: unknown, event: Event) =>
    order.push(`original:${event.defaultPrevented}`),
  );
  const item: TagProps = {
    tagKey: "snapshot",
    children: "snapshot",
    closable: true,
    onClose: (_children, event) => {
      order.push("item");
      callback.value = replacement;
      event.preventDefault();
    },
  };
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <TagGroup onTagClose={callback.value} tagList={[item]} />
    )),
  );
  try {
    await settle();
    const close = fixture.host.querySelector<HTMLElement>(".semi-tag-close")!;
    close.click();
    expect(order).toEqual(["item", "original:true"]);
    await settle();
    close.click();
    expect(order).toEqual([
      "item",
      "original:true",
      "item",
      "replacement:true",
    ]);
  } finally {
    fixture.unmount();
  }
});
