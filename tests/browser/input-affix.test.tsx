import { defineVaporComponent, effectScope, nextTick, ref } from "vue";
import { expect, test } from "vitest";
import Icon from "../../packages/semi-icons-vue/src/components/Icon.js";
import IconSearch from "../../packages/semi-icons-vue/src/icons/IconSearch.js";
import { useInputAffixIcon } from "../../packages/semi-ui-vue/src/components/input/input-affix.js";
import Input from "../../packages/semi-ui-vue/src/components/input/Input.js";
import { mountVapor } from "../support/mount-vapor.js";

async function settle() {
  await nextTick();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  await nextTick();
}

test("Input classifies owned single native icons in renderer and slots without probing", async () => {
  const custom = ref("custom");
  let renders = 0;
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Input
        addonAfter={() => <Icon prefixCls={custom.value} />}
        addonBefore={() => <IconSearch />}
        defaultValue="clear"
        prefix={() => <IconSearch />}
        showClear
        v-slots={{
          suffix: () => {
            renders++;
            return <Icon prefixCls={custom.value} />;
          },
        }}
      />
    )),
  );
  try {
    await settle();
    for (const name of ["prefix", "suffix", "prepend", "append"])
      expect(
        mounted.host
          .querySelector(`.semi-input-${name}`)!
          .classList.contains(`semi-input-${name}-icon`),
      ).toBe(true);
    expect(
      mounted.host
        .querySelector(".semi-input-wrapper")!
        .classList.contains("semi-input-wrapper__with-suffix-icon"),
    ).toBe(true);
    expect(renders).toBe(1);
    custom.value = "next";
    await settle();
    expect(mounted.host.querySelector(".next-icon")).not.toBeNull();
    expect(
      mounted.host.querySelector(".semi-input-suffix-icon"),
    ).not.toBeNull();
    expect(renders).toBe(1);
  } finally {
    mounted.unmount();
  }
});

test("Input icon classification follows dynamic single roots and excludes text, multiple roots and nested wrappers", async () => {
  const mode = ref("single");
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Input
        v-slots={{
          prefix: () => (
            <>
              {mode.value === "single" ? (
                <IconSearch />
              ) : mode.value === "multiple" ? (
                <>
                  <IconSearch />
                  <IconSearch />
                </>
              ) : mode.value === "nested" ? (
                <span>
                  <IconSearch />
                </span>
              ) : mode.value === "text" ? (
                <>
                  text
                  <IconSearch />
                </>
              ) : (
                <></>
              )}
            </>
          ),
        }}
      />
    )),
  );
  try {
    await settle();
    const prefix = mounted.host.querySelector(".semi-input-prefix")!;
    expect(prefix.classList.contains("semi-input-prefix-icon")).toBe(true);
    for (const value of ["multiple", "nested", "text", "empty"]) {
      mode.value = value;
      await settle();
      expect(prefix.classList.contains("semi-input-prefix-icon")).toBe(false);
    }
    mode.value = "single";
    await settle();
    expect(prefix.classList.contains("semi-input-prefix-icon")).toBe(true);
  } finally {
    mounted.unmount();
  }
});

test("Input affix observers disconnect and stale callbacks cannot change retained state", async () => {
  const Native = window.MutationObserver;
  const records: {
    observer: MutationObserver;
    invoke: () => void;
    connected: boolean;
  }[] = [];
  class Tracked extends Native {
    constructor(callback: MutationCallback) {
      super(callback);
      records.push({
        observer: this,
        invoke: () => callback([], this),
        connected: false,
      });
    }
    override observe(target: Node, options?: MutationObserverInit) {
      super.observe(target, options);
      records.find((record) => record.observer === this)!.connected = true;
    }
    override disconnect() {
      super.disconnect();
      records.find((record) => record.observer === this)!.connected = false;
    }
  }
  Object.defineProperty(window, "MutationObserver", {
    configurable: true,
    value: Tracked,
  });
  const root = ref<HTMLElement | null>(null);
  const scope = effectScope();
  const result = scope.run(() => useInputAffixIcon(root))!;
  const element = document.createElement("div");
  element.append(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
  try {
    root.value = element;
    await settle();
    expect(result.value).toBe(true);
    expect(records.filter((record) => record.connected)).toHaveLength(1);
    scope.stop();
    expect(records.every((record) => !record.connected)).toBe(true);
    element.replaceChildren();
    records.forEach((record) => record.invoke());
    expect(result.value).toBe(true);
  } finally {
    scope.stop();
    Object.defineProperty(window, "MutationObserver", {
      configurable: true,
      value: Native,
    });
  }
});

test("Input affix classification works initially without MutationObserver", async () => {
  const Native = window.MutationObserver;
  Object.defineProperty(window, "MutationObserver", {
    configurable: true,
    value: undefined,
  });
  const mounted = mountVapor(
    defineVaporComponent(() => <Input prefix={() => <IconSearch />} />),
  );
  try {
    await nextTick();
    expect(
      mounted.host.querySelector(".semi-input-prefix-icon"),
    ).not.toBeNull();
  } finally {
    mounted.unmount();
    Object.defineProperty(window, "MutationObserver", {
      configurable: true,
      value: Native,
    });
  }
});
