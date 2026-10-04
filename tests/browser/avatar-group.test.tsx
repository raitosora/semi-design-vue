import {
  defineVaporComponent,
  nextTick,
  shallowRef,
  type ShallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test, vi } from "vitest";
import Avatar from "../../packages/semi-ui-vue/src/components/avatar/Avatar.js";
import AvatarGroup from "../../packages/semi-ui-vue/src/components/avatar/avatarGroup.js";
import type { AvatarGroupProps } from "../../packages/semi-ui-vue/src/components/avatar/group-types.js";
import { mountVapor } from "../support/mount-vapor.js";

const settle = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};
const avatars = (host: HTMLElement) => [
  ...host.querySelectorAll<HTMLElement>(
    ".semi-avatar:not(.semi-avatar-item-more)",
  ),
];
const visible = (host: HTMLElement) =>
  avatars(host).filter((node) => !node.hidden);

test("AvatarGroup owns one slot tree and preserves keyed identity, hidden focus isolation and DOM ordering", async () => {
  const items = shallowRef(["a", "b", "c"]);
  const maxCount = shallowRef(2);
  const slot = vi.fn(() => (
    <For getKey={(name: string) => name} in={items.value}>
      {(name: ShallowRef<string>) => (
        <Avatar alt={name.value} key={name.value}>
          {() => <button data-name={name.value}>{name.value}</button>}
        </Avatar>
      )}
    </For>
  ));
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <AvatarGroup maxCount={maxCount.value}>{slot}</AvatarGroup>
    )),
  );
  try {
    await settle();
    expect(visible(fixture.host).map((node) => node.textContent)).toEqual([
      "a",
      "b",
    ]);
    const originals = new Map(
      avatars(fixture.host).map((node) => [node.textContent, node]),
    );
    const c = originals.get("c")!;
    expect(c.hidden).toBe(true);
    expect(c.inert).toBe(true);
    expect(c.getAttribute("aria-hidden")).toBe("true");
    c.querySelector("button")!.focus();
    expect(document.activeElement).not.toBe(c.querySelector("button"));
    expect(
      fixture.host.querySelector(".semi-avatar-item-more")?.textContent,
    ).toBe("+1");
    items.value = ["c", "a", "b"];
    await settle();
    expect(visible(fixture.host).map((node) => node.textContent)).toEqual([
      "c",
      "a",
    ]);
    expect(avatars(fixture.host)[0]).toBe(c);
    expect(c.classList.contains("semi-avatar-item-start-0")).toBe(true);
    maxCount.value = 3;
    await settle();
    expect(visible(fixture.host)).toHaveLength(3);
    expect(c.hidden).toBe(false);
    expect(c.inert).toBe(false);
    expect(c.getAttribute("aria-hidden")).toBeNull();
    items.value = ["b", "d"];
    await settle();
    expect(avatars(fixture.host)[0]).toBe(originals.get("b"));
    expect(originals.get("a")!.isConnected).toBe(false);
    expect(slot).toHaveBeenCalledTimes(1);
  } finally {
    fixture.unmount();
  }
  expect(fixture.host.childElementCount).toBe(0);
});

test("AvatarGroup enforces size/shape, forwards rest to items, isolates nested groups and updates removed inputs", async () => {
  const props = shallowRef<AvatarGroupProps>({
    size: "large",
    shape: "square",
    overlapFrom: "end",
    color: "red",
    className: "group-rest",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <AvatarGroup {...props.value}>
        {() => (
          <>
            <Avatar
              children="A"
              className="child"
              color="blue"
              shape="circle"
              size="small"
            />
            <AvatarGroup size="small">
              {() => <Avatar children="B" />}
            </AvatarGroup>
          </>
        )}
      </AvatarGroup>
    )),
  );
  try {
    await settle();
    const [a, b] = avatars(fixture.host);
    expect(a!.className).toContain("semi-avatar-large");
    expect(a!.className).toContain("semi-avatar-square");
    expect(a!.className).toContain("semi-avatar-red");
    expect(a!.className).toContain("semi-avatar-item-end-0");
    expect(a!.className).toContain("child");
    expect(a!.className).not.toContain("group-rest");
    expect(b!.className).toContain("semi-avatar-small");
    expect(fixture.host.querySelector(".semi-avatar-group")!.className).toBe(
      "semi-avatar-group",
    );
    props.value = { size: undefined, shape: undefined, overlapFrom: undefined };
    await settle();
    expect(a!.className).toContain("semi-avatar-medium");
    expect(a!.className).toContain("semi-avatar-circle");
    expect(a!.className).toContain("semi-avatar-blue");
    expect(a!.className).toContain("semi-avatar-item-start-0");
  } finally {
    fixture.unmount();
  }
});

test("AvatarGroup preserves upstream maxCount slice arithmetic including fractional, negative and nonfinite values", async () => {
  const maxCount = shallowRef<number | undefined>(undefined);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <AvatarGroup maxCount={maxCount.value}>
        {() => (
          <>
            <Avatar children="A" />
            <Avatar children="B" />
            <Avatar children="C" />
          </>
        )}
      </AvatarGroup>
    )),
  );
  try {
    for (const [limit, count, more] of [
      [undefined, 3, null],
      [0, 0, "+3"],
      [1.5, 1, "+1.5"],
      [-1, 2, "+4"],
      [-9, 0, "+12"],
      [NaN, 3, null],
      [Infinity, 3, null],
      [-Infinity, 0, "+Infinity"],
      [3, 3, null],
    ] as const) {
      maxCount.value = limit;
      await settle();
      expect(visible(fixture.host), String(limit)).toHaveLength(count);
      expect(
        fixture.host.querySelector(".semi-avatar-item-more")?.textContent ??
          null,
        String(limit),
      ).toBe(more);
    }
  } finally {
    fixture.unmount();
  }
});

test("AvatarGroup accepts genuine boxed numbers and ignores nonnumeric runtime maxCount without coercion", async () => {
  const maxCount = shallowRef<unknown>(Object(1));
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <AvatarGroup maxCount={maxCount.value as number}>
        {() => (
          <>
            <Avatar children="A" />
            <Avatar children="B" />
          </>
        )}
      </AvatarGroup>
    )),
  );
  try {
    await settle();
    expect(visible(fixture.host)).toHaveLength(1);
    expect(
      fixture.host.querySelector(".semi-avatar-item-more")?.textContent,
    ).toBe("+1");
    const coercion = vi.fn(() => 0);
    for (const value of [
      null,
      "0",
      false,
      Symbol("limit"),
      { valueOf: coercion },
      Object(NaN),
    ]) {
      maxCount.value = value;
      await settle();
      expect(visible(fixture.host)).toHaveLength(2);
      expect(fixture.host.querySelector(".semi-avatar-item-more")).toBeNull();
    }
    expect(coercion).not.toHaveBeenCalled();
  } finally {
    fixture.unmount();
  }
});

test("AvatarGroup distinguishes an absent slot from an owned empty slot without executing a probe", async () => {
  const empty = vi.fn(() => <></>);
  const absent = mountVapor(
    defineVaporComponent(() => <AvatarGroup maxCount={-1} />),
  );
  const present = mountVapor(
    defineVaporComponent(() => (
      <AvatarGroup maxCount={-1}>{empty}</AvatarGroup>
    )),
  );
  try {
    await settle();
    expect(absent.host.querySelector(".semi-avatar-item-more")).toBeNull();
    expect(
      present.host.querySelector(".semi-avatar-item-more")?.textContent,
    ).toBe("+1");
    expect(empty).toHaveBeenCalledTimes(1);
  } finally {
    absent.unmount();
    present.unmount();
  }
});

test("AvatarGroup invalid overlap values add no overlap class and nonfunction renderMore keeps the default", async () => {
  const props = shallowRef({
    overlapFrom: "invalid",
    renderMore: 12,
  } as unknown as AvatarGroupProps);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <AvatarGroup {...props.value} maxCount={0}>
        {() => <Avatar children="A" />}
      </AvatarGroup>
    )),
  );
  try {
    await settle();
    const more = fixture.host.querySelector<HTMLElement>(
      ".semi-avatar-item-more",
    )!;
    expect(more.textContent).toBe("+1");
    expect(
      [...more.classList].filter(
        (name) =>
          name.startsWith("semi-avatar-item-") &&
          name !== "semi-avatar-item-more",
      ),
    ).toEqual([]);
    props.value = { overlapFrom: "end" };
    await settle();
    expect(more.classList.contains("semi-avatar-item-end-0")).toBe(true);
  } finally {
    fixture.unmount();
  }
});
