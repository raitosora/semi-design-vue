import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import Tag from "../../packages/semi-ui-vue/src/components/tag/Tag.js";
import type { TagProps } from "../../packages/semi-ui-vue/src/components/tag/types.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Tag defaults, data updates, classes and undefined defaults preserve its DOM", async () => {
  const props = shallowRef<TagProps>({ children: "tag" });
  const fixture = mountVapor(
    defineVaporComponent(() => <Tag {...props.value} />),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-tag")!;
    expect(root.className).toContain("semi-tag-default");
    expect(root.className).toContain("semi-tag-grey-light");
    expect(root.className).toContain("semi-tag-square");
    expect(root.getAttribute("role")).toBeNull();
    expect(root.getAttribute("aria-label")).toBe("Tag: tag");
    props.value = {
      children: 0,
      shape: "circle",
      size: "large",
      color: "white",
      type: "solid",
      colorful: true,
      gradient: true,
    };
    await nextTick();
    expect(fixture.host.querySelector(".semi-tag")).toBe(root);
    expect(root.textContent).toBe("0");
    expect(root.className).toContain("semi-tag-white-solid");
    expect(root.className).toContain("semi-tag-circle");
    expect(root.querySelector(".semi-tag-content-center")).not.toBeNull();
    props.value = {
      children: "again",
      size: undefined,
      shape: undefined,
      color: undefined,
    };
    await nextTick();
    expect(root.className).toContain("semi-tag-default");
    expect(root.className).toContain("semi-tag-grey-light");
  } finally {
    fixture.unmount();
  }
});

test("Tag close stops propagation, passes current data and false does not veto hiding", async () => {
  const close = vi.fn(() => false);
  const click = vi.fn();
  const parent = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <div onClick={parent}>
        <Tag
          children="value"
          closable
          onClick={click}
          onClose={close}
          tagKey={0}
        />
      </div>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-tag")!;
    const closeNode = root.querySelector<HTMLElement>(".semi-tag-close")!;
    const sameNodeListener = vi.fn();
    closeNode.addEventListener("click", sameNodeListener);
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    closeNode.dispatchEvent(event);
    await nextTick();
    expect(close.mock.calls).toEqual([["value", event, 0]]);
    expect(click).not.toHaveBeenCalled();
    expect(parent).not.toHaveBeenCalled();
    expect(sameNodeListener).not.toHaveBeenCalled();
    expect(root.className).toContain("semi-tag-invisible");
    expect(root.isConnected).toBe(true);
  } finally {
    fixture.unmount();
  }
});

test("Tag controlled presence includes undefined and removal retains the last snapshot", async () => {
  const props = shallowRef<TagProps>({
    children: "value",
    closable: true,
    visible: true,
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Tag {...props.value} />),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-tag")!;
    root.querySelector<HTMLElement>(".semi-tag-close")!.click();
    await nextTick();
    expect(root.classList.contains("semi-tag-invisible")).toBe(false);
    props.value = { ...props.value, visible: undefined };
    await nextTick();
    expect(root.classList.contains("semi-tag-invisible")).toBe(true);
    props.value = { children: "removed", closable: true };
    await nextTick();
    expect(root.classList.contains("semi-tag-invisible")).toBe(true);
    props.value = { ...props.value, visible: true };
    await nextTick();
    props.value = { children: "removed again", closable: true };
    await nextTick();
    expect(root.classList.contains("semi-tag-invisible")).toBe(false);
    root.querySelector<HTMLElement>(".semi-tag-close")!.click();
    await nextTick();
    expect(root.classList.contains("semi-tag-invisible")).toBe(true);
  } finally {
    fixture.unmount();
  }
});

test("Tag preventDefault veto, keyboard ordering and Escape follow the fixed source", async () => {
  const calls: string[] = [];
  const props = shallowRef<TagProps>({
    children: "keys",
    closable: true,
    onClose: (_value, event) => {
      calls.push(`close:${event.defaultPrevented}`);
      event.preventDefault();
    },
    onClick: () => {
      calls.push("click");
    },
    onKeyDown: (event) => {
      calls.push(`key:${event.defaultPrevented}`);
    },
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Tag {...props.value} />),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-tag")!;
    expect(root.getAttribute("role")).toBe("button");
    expect(root.tabIndex).toBe(0);
    root.focus();
    for (const key of ["Delete", "Backspace", "Enter", "Other", "Escape"])
      root.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
      );
    await nextTick();
    expect(calls).toEqual([
      "close:false",
      "key:true",
      "close:false",
      "key:true",
      "click",
      "key:true",
      "key:false",
      "key:false",
    ]);
    expect(root.classList.contains("semi-tag-invisible")).toBe(false);
    expect(document.activeElement).not.toBe(root);
    props.value = {
      children: "passive",
      tabIndex: -1,
      onKeyDown: (event) => calls.push(event.key),
    };
    await nextTick();
    expect(root.getAttribute("role")).toBeNull();
    expect(root.tabIndex).toBe(-1);
    root.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Delete", cancelable: true }),
    );
    expect(calls.at(-1)).toBe("Delete");
  } finally {
    fixture.unmount();
  }
});

test("Tag accessible label preserves explicit undefined, null and empty and restores on removal", async () => {
  const props = shallowRef<TagProps>({ children: "label" });
  const fixture = mountVapor(
    defineVaporComponent(() => <Tag {...props.value} />),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-tag")!;
    expect(root.getAttribute("aria-label")).toBe("Tag: label");
    for (const value of [undefined, null, "", "custom"]) {
      props.value = {
        children: "label",
        "aria-label": value as string | undefined,
      };
      await nextTick();
      expect(root.getAttribute("aria-label")).toBe(value ?? null);
    }
    props.value = { children: "label", closable: true, tabIndex: -1 };
    await nextTick();
    expect(root.getAttribute("aria-label")).toBe("Closable Tag: label");
    expect(root.tabIndex).toBe(-1);
  } finally {
    fixture.unmount();
  }
});

test("Tag keyboard delete without closable prevents propagation but never closes", async () => {
  const click = vi.fn();
  const close = vi.fn();
  const parent = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <div onKeydown={parent}>
        <Tag children="interactive" onClick={click} onClose={close} />
      </div>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-tag")!;
    const event = new KeyboardEvent("keydown", {
      key: "Delete",
      bubbles: true,
      cancelable: true,
    });
    root.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(parent).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    expect(root.classList.contains("semi-tag-invisible")).toBe(false);
  } finally {
    fixture.unmount();
  }
});

test("Tag merged close callbacks share one event data snapshot during synchronous updates", () => {
  const props = shallowRef<TagProps>({
    children: "before",
    tagKey: "old",
    closable: true,
  });
  const received: unknown[][] = [];
  const first: NonNullable<TagProps["onClose"]> = (value, event, key) => {
    received.push([value, event, key]);
    props.value = { children: "after", tagKey: "new", closable: true };
  };
  const second: NonNullable<TagProps["onClose"]> = (value, event, key) => {
    received.push([value, event, key]);
  };
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Tag {...props.value} {...{ onClose: first }} {...{ onClose: second }} />
    )),
  );
  try {
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    fixture.host.querySelector(".semi-tag-close")!.dispatchEvent(event);
    expect(received).toEqual([
      ["before", event, "old"],
      ["before", event, "old"],
    ]);
  } finally {
    fixture.unmount();
  }
});

test("Tag close evaluates current controlled presence after the callback returns", async () => {
  const props = shallowRef<TagProps>({ children: "live", closable: true });
  let control = true;
  const close = () => {
    props.value = control
      ? { children: "controlled", closable: true, visible: true }
      : { children: "uncontrolled", closable: true };
  };
  const fixture = mountVapor(
    defineVaporComponent(() => <Tag {...props.value} onClose={close} />),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-tag")!;
    root.querySelector<HTMLElement>(".semi-tag-close")!.click();
    await nextTick();
    expect(root.classList.contains("semi-tag-invisible")).toBe(false);
    control = false;
    root.querySelector<HTMLElement>(".semi-tag-close")!.click();
    await nextTick();
    expect(root.classList.contains("semi-tag-invisible")).toBe(true);
  } finally {
    fixture.unmount();
  }
});

test("Tag keyboard callbacks retain the handler captured before close mutates props", async () => {
  const before = vi.fn();
  const after = vi.fn();
  const props = shallowRef<TagProps>({
    children: "keys",
    closable: true,
    onKeyDown: before,
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Tag
        {...props.value}
        onClose={() => {
          props.value = {
            children: "updated",
            closable: true,
            onKeyDown: after,
          };
        }}
      />
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-tag")!;
    const event = new KeyboardEvent("keydown", {
      key: "Delete",
      bubbles: true,
      cancelable: true,
    });
    root.dispatchEvent(event);
    expect(before.mock.calls).toEqual([[event]]);
    expect(after).not.toHaveBeenCalled();
    await nextTick();
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "Other" }));
    expect(after).toHaveBeenCalledTimes(1);
  } finally {
    fixture.unmount();
  }
});

test("Tag close snapshots a merged callback array against in-place mutation until the next event", () => {
  const received: string[] = [];
  const added: NonNullable<TagProps["onClose"]> = () => {
    received.push("added");
  };
  let changed = false;
  const callbacks: NonNullable<TagProps["onClose"]>[] = [
    () => {
      received.push("first");
      if (!changed) {
        changed = true;
        callbacks.splice(1, 1);
        callbacks.push(added);
      }
    },
    () => {
      received.push("original");
    },
  ];
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Tag
        children="array"
        closable
        onClose={callbacks as unknown as TagProps["onClose"]}
      />
    )),
  );
  try {
    const close = fixture.host.querySelector<HTMLElement>(".semi-tag-close")!;
    close.click();
    expect(received).toEqual(["first", "original"]);
    close.click();
    expect(received).toEqual(["first", "original", "first", "added"]);
  } finally {
    fixture.unmount();
  }
});

test("Tag keyboard snapshots the callback array before an earlier callback mutates it", () => {
  const received: string[] = [];
  const added: NonNullable<TagProps["onKeyDown"]> = () => {
    received.push("added");
  };
  let changed = false;
  const callbacks: NonNullable<TagProps["onKeyDown"]>[] = [
    () => {
      received.push("first");
      if (!changed) {
        changed = true;
        callbacks.splice(1, 1);
        callbacks.push(added);
      }
    },
    () => {
      received.push("original");
    },
  ];
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Tag
        children="array"
        onKeyDown={callbacks as unknown as TagProps["onKeyDown"]}
      />
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-tag")!;
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "Other" }));
    expect(received).toEqual(["first", "original"]);
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "Other" }));
    expect(received).toEqual(["first", "original", "first", "added"]);
  } finally {
    fixture.unmount();
  }
});

test.each(["click", "mouseenter"] as const)(
  "Tag %s snapshots merged callback arrays for each dispatch",
  (eventName) => {
    const received: string[] = [];
    let changed = false;
    const added = () => {
      received.push("added");
    };
    const callbacks = [
      () => {
        received.push("first");
        if (!changed) {
          changed = true;
          callbacks.splice(1, 1);
          callbacks.push(added);
        }
      },
      () => {
        received.push("original");
      },
    ];
    const props = {
      [eventName === "click" ? "onClick" : "onMouseEnter"]: callbacks,
    } as unknown as TagProps;
    const fixture = mountVapor(
      defineVaporComponent(() => <Tag {...props} children="array" />),
    );
    try {
      const root = fixture.host.querySelector<HTMLElement>(".semi-tag")!;
      root.dispatchEvent(new MouseEvent(eventName));
      expect(received).toEqual(["first", "original"]);
      root.dispatchEvent(new MouseEvent(eventName));
      expect(received).toEqual(["first", "original", "first", "added"]);
    } finally {
      fixture.unmount();
    }
  },
);
