import {
  defineVaporComponent,
  nextTick,
  onMounted,
  onUnmounted,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import Avatar from "../../packages/semi-ui-vue/src/components/avatar/Avatar.js";
import AvatarGroup from "../../packages/semi-ui-vue/src/components/avatar/avatarGroup.js";
import type {
  AvatarGroupItem,
  AvatarGroupProps,
} from "../../packages/semi-ui-vue/src/components/avatar/group-types.js";
import { mountVapor } from "../support/mount-vapor.js";

const settle = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};

test("AvatarGroup renderMore receives immutable snapshots and owns reactive fragment output exactly once", async () => {
  const label = shallowRef("second");
  const details = shallowRef(false);
  const mounted = vi.fn();
  const unmounted = vi.fn();
  const clicked = vi.fn();
  const renderMore = vi.fn(
    (count: number, rest: readonly AvatarGroupItem[]) => (
      <>
        <button data-more onClick={clicked}>
          {count}:{rest.map((item) => item.label).join(",")}
        </button>
        <More />
      </>
    ),
  );
  const More = defineVaporComponent(() => {
    onMounted(mounted);
    onUnmounted(unmounted);
    return (
      <Avatar
        children={details.value ? "expanded" : "compact"}
        data-custom-more
      />
    );
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <AvatarGroup maxCount={1} renderMore={renderMore} size="large">
        {() => (
          <>
            <Avatar children="first" />
            <Avatar alt={label.value} children="second" />
            <Avatar children="third" />
          </>
        )}
      </AvatarGroup>
    )),
  );
  try {
    await settle();
    expect(fixture.host.querySelector("[data-more]")?.textContent).toBe(
      "2:second,third",
    );
    expect(renderMore).toHaveBeenCalledTimes(1);
    expect(mounted).toHaveBeenCalledTimes(1);
    const snapshot = renderMore.mock.calls[0]![1];
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot[0])).toBe(true);
    expect(Object.isFrozen(snapshot[0]!.props)).toBe(true);
    expect(snapshot.map((entry) => entry.index)).toEqual([1, 2]);
    expect(typeof snapshot[0]!.id).toBe("symbol");
    expect(Object.keys(snapshot[0]!)).toEqual([
      "id",
      "index",
      "props",
      "label",
    ]);
    const custom =
      fixture.host.querySelector<HTMLElement>("[data-custom-more]")!;
    expect(custom.classList.contains("semi-avatar-large")).toBe(true);
    expect(custom.classList.contains("semi-avatar-item-start-1")).toBe(true);
    expect(custom.hidden).toBe(false);
    fixture.host.querySelector<HTMLButtonElement>("[data-more]")!.click();
    expect(clicked).toHaveBeenCalledTimes(1);
    details.value = true;
    await settle();
    expect(fixture.host.querySelector("[data-custom-more]")).toBe(custom);
    expect(custom.textContent).toBe("expanded");
    expect(renderMore).toHaveBeenCalledTimes(1);
    label.value = "renamed";
    await settle();
    expect(fixture.host.querySelector("[data-more]")?.textContent).toBe(
      "2:renamed,third",
    );
    expect(snapshot[0]!.label).toBe("second");
    expect(mounted.mock.calls.length - unmounted.mock.calls.length).toBe(1);
  } finally {
    fixture.unmount();
  }
  expect(mounted.mock.calls.length).toBe(unmounted.mock.calls.length);
});

test("AvatarGroup supports conditional multi-root descendants, independent apps and remount cleanup", async () => {
  const names = shallowRef(["a", "b"]);
  const shown = shallowRef(true);
  const Descendants = defineVaporComponent(() => (
    <>
      <span data-nonavatar>label</span>
      {names.value.map((name) => (
        <Avatar children={name} key={name} />
      ))}
    </>
  ));
  const view = defineVaporComponent(() => (
    <AvatarGroup v-if={shown.value} maxCount={1}>
      {() => <Descendants />}
    </AvatarGroup>
  ));
  const fixture = mountVapor(view);
  const other = mountVapor(
    defineVaporComponent(() => (
      <AvatarGroup maxCount={0}>
        {() => <Avatar children="other" />}
      </AvatarGroup>
    )),
  );
  try {
    await settle();
    expect(fixture.host.querySelectorAll(".semi-avatar")).toHaveLength(3);
    expect(fixture.host.querySelector("[data-nonavatar]")?.textContent).toBe(
      "label",
    );
    expect(
      other.host.querySelector(".semi-avatar-item-more")?.textContent,
    ).toBe("+1");
    names.value = [];
    await settle();
    expect(fixture.host.querySelectorAll(".semi-avatar")).toHaveLength(0);
    expect(
      other.host.querySelector(".semi-avatar-item-more")?.textContent,
    ).toBe("+1");
    shown.value = false;
    await settle();
    expect(fixture.host.querySelector(".semi-avatar-group")).toBeNull();
    names.value = ["c", "d", "e"];
    shown.value = true;
    await settle();
    expect(
      fixture.host.querySelector(".semi-avatar-item-more")?.textContent,
    ).toBe("+2");
    const hidden = [
      ...fixture.host.querySelectorAll<HTMLElement>(".semi-avatar[hidden]"),
    ];
    expect(hidden.map((node) => node.textContent)).toEqual(["d", "e"]);
  } finally {
    fixture.unmount();
    other.unmount();
  }
  expect(fixture.host.childElementCount).toBe(0);
  expect(other.host.childElementCount).toBe(0);
});

test("AvatarGroup default more alt uses explicit empty alt and current text, and renderer removal restores it", async () => {
  const props = shallowRef<AvatarGroupProps>({ maxCount: 0 });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <AvatarGroup {...props.value}>
        {() => (
          <>
            <Avatar alt="" children="fallback" />
            <Avatar children="Text" />
            <Avatar>{() => <strong>rich</strong>}</Avatar>
          </>
        )}
      </AvatarGroup>
    )),
  );
  try {
    await settle();
    expect(
      fixture.host
        .querySelector(".semi-avatar-item-more [role=img]")
        ?.getAttribute("aria-label"),
    ).toBe(" Number of remaining Avatars：3,Text");
    props.value = { maxCount: 0, renderMore: () => null };
    await settle();
    expect(fixture.host.querySelector(".semi-avatar-item-more")).toBeNull();
    props.value = { maxCount: 0, renderMore: () => ["count:", 3, false, null] };
    await settle();
    expect(
      fixture.host.querySelector(".semi-avatar-group")!.textContent,
    ).toContain("count:3");
    props.value = { maxCount: 0, renderMore: undefined };
    await settle();
    expect(
      fixture.host.querySelector(".semi-avatar-item-more")?.textContent,
    ).toBe("+3");
  } finally {
    fixture.unmount();
  }
});
