import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  onScopeDispose,
  watchEffect,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import Steps from "../../packages/semi-ui-vue/src/components/steps/index.js";
import Row from "../../packages/semi-ui-vue/src/components/grid/Row.js";
import Col from "../../packages/semi-ui-vue/src/components/grid/Col.js";
import Step from "../../packages/semi-ui-vue/src/components/steps/step.js";
import type {
  StepProps,
  StepsProps,
  StepsContent,
} from "../../packages/semi-ui-vue/src/components/steps/types.js";
import { mountVapor } from "../support/mount-vapor.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};
test.each(["fill", "basic", "nav"] as const)(
  "Steps %s retains native attributes event bubbling and safe content",
  async (type) => {
    const outer = vi.fn(),
      own = vi.fn();
    const input = shallowRef<StepsProps>({
      type,
      "aria-label": "steps",
      className: "root",
      style: { marginTop: "3px" },
    });
    const item = shallowRef<StepProps>({
      "aria-label": "item",
      role: "button",
      className: "custom",
      style: { paddingTop: "2px" },
    });
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <section onClick={outer}>
          <Steps
            {...input.value}
            class="local"
            data-root="yes"
            {...{ role: "tablist", id: "ignored", innerHTML: "<img>" }}
          >
            {() => (
              <Step
                {...item.value}
                class="local-item"
                onClick={own}
                title="<img src=x>"
                {...{
                  "data-child": "ignored",
                  tabindex: -1,
                  innerHTML: "<img>",
                }}
              />
            )}
          </Steps>
        </section>
      )),
    );
    try {
      await settle();
      const root = fixture.host.querySelector<HTMLElement>("[data-root]")!;
      const node = root.querySelector<HTMLElement>(".semi-steps-item")!;
      expect(root.getAttribute("aria-label")).toBe("steps");
      expect(node.getAttribute("aria-label")).toBe("item");
      expect(node.getAttribute("role")).toBe("button");
      expect(node.tabIndex).toBe(0);
      expect(node.hasAttribute("data-child")).toBe(false);
      expect(root.hasAttribute("role")).toBe(false);
      expect(root.hasAttribute("id")).toBe(false);
      expect(root.querySelector("img")).toBeNull();
      expect(root.classList).toContain("local");
      expect(node.classList).toContain("local-item");
      expect(node.style.paddingTop).toBe("2px");
      node.click();
      expect(own).toHaveBeenCalledTimes(1);
      expect(outer).toHaveBeenCalledTimes(1);
      expect(own.mock.calls[0]![0]).toBeInstanceOf(MouseEvent);
      input.value = { type };
      item.value = {};
      await settle();
      expect(root.getAttribute("aria-label")).toBeNull();
      expect(node.getAttribute("aria-label")).toBeNull();
      expect(node.getAttribute("role")).toBeNull();
      expect(node.style.paddingTop).toBe("");
    } finally {
      fixture.unmount();
    }
  },
);
test.each(["fill", "basic"] as const)(
  "Steps %s preserves status truthiness and mode-specific icon defaults",
  async (type) => {
    const parent = shallowRef<StepsProps>({ type, current: 1 }),
      child = shallowRef<StepProps>({});
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <Steps {...parent.value}>
          {() => (
            <>
              <Step title="first" />
              <Step {...child.value} title="second" />
              <Step title="last" />
            </>
          )}
        </Steps>
      )),
    );
    try {
      for (const status of [
        "wait",
        "process",
        "finish",
        "error",
        "warning",
        undefined,
        null,
        false,
        0,
        "",
      ]) {
        child.value = { status } as StepProps;
        await settle();
        const items = fixture.host.querySelectorAll(".semi-steps-item");
        expect(items[1]!.classList).toContain(
          `semi-steps-item-${status || "process"}`,
        );
      }
      parent.value = {
        type,
        current: 0,
        status: null,
      } as unknown as StepsProps;
      await settle();
      expect(
        fixture.host
          .querySelector(".semi-steps-item")!
          .classList.contains("semi-steps-item-null"),
      ).toBe(type === "basic");
      child.value = { status: "unknown" } as unknown as StepProps;
      await settle();
      expect(
        fixture.host
          .querySelectorAll(".semi-steps-item")[1]!
          .querySelector(".semi-steps-item-icon"),
      ).toBeNull();
    } finally {
      fixture.unmount();
    }
  },
);
test("Steps basic runtime child override priority and parent root prefix stay independent", async () => {
  const extra = shallowRef<Record<string, unknown>>({
    stepNumber: "custom",
    size: "small",
    active: false,
    done: false,
    prefixCls: "own-step",
    onChange: vi.fn(),
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Steps current={1} initial={1} prefixCls="own-root" type="basic">
        {() => <Step {...extra.value} title="title" />}
      </Steps>
    )),
  );
  try {
    await settle();
    let item = fixture.host.querySelector(".own-step")!;
    expect(item.classList).toContain("own-step-active");
    expect(item.querySelector(".own-step-number-icon")?.textContent).toBe(
      "custom",
    );
    extra.value = { stepNumber: undefined, size: undefined };
    await settle();
    item = fixture.host.querySelector(".semi-steps-item")!;
    expect(
      item.querySelector(".semi-steps-item-number-icon")?.textContent,
    ).toBe("");
    extra.value = {};
    await settle();
    expect(
      item.querySelector(".semi-steps-item-number-icon")?.textContent,
    ).toBe("2");
  } finally {
    fixture.unmount();
  }
});
test("Steps manages only direct native items and releases the actual observer on unmount", async () => {
  const Native = window.MutationObserver;
  const callbacks: MutationCallback[] = [];
  const disconnect = vi.fn(),
    observe = vi.fn();
  const spy = vi
    .spyOn(window, "MutationObserver")
    .mockImplementation(function (callback) {
      callbacks.push(callback);
      return {
        observe,
        disconnect,
        takeRecords: () => [],
      } as unknown as MutationObserver;
    });
  let fixture: ReturnType<typeof mountVapor> | undefined;
  try {
    fixture = mountVapor(
      defineVaporComponent(() => (
        <Steps type="basic">
          {() => (
            <>
              <Step title="outer" />
              <div>
                <Step title="nested" />
              </div>
            </>
          )}
        </Steps>
      )),
    );
    await settle();
    const nodes = fixture.host.querySelectorAll(".semi-steps-item");
    expect(nodes[0]!.classList).toContain("semi-steps-item-process");
    expect(nodes[1]!.classList).toContain("semi-steps-item-wait");
    expect(observe).toHaveBeenCalledWith(expect.any(HTMLDivElement), {
      childList: true,
      subtree: false,
    });
    const observer = new Native(() => undefined);
    fixture.unmount();
    fixture = undefined;
    expect(disconnect).toHaveBeenCalledTimes(1);
    callbacks.forEach((callback) => callback([], observer));
    await settle();
    expect(observe).toHaveBeenCalledTimes(1);
    observer.disconnect();
  } finally {
    fixture?.unmount();
    spy.mockRestore();
  }
});
test("Steps reports invalid native renderer results and never continues after a thrown child callback", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const errors: unknown[] = [];
  const input = shallowRef<StepsContent>("valid");
  const parent = vi.fn();
  const app = createVaporApp(
    defineVaporComponent(() => (
      <Steps current={1} onChange={parent} type="basic">
        {() => (
          <Step
            onClick={() => {
              throw new Error("child failure");
            }}
            title={input.value}
          />
        )}
      </Steps>
    )),
  );
  app.config.errorHandler = (error) => errors.push(error);
  try {
    app.mount(host);
    await settle();
    host.querySelector<HTMLElement>(".semi-steps-item")!.click();
    expect(errors).toHaveLength(1);
    expect(parent).not.toHaveBeenCalled();
    input.value = (() => ({ invalid: true })) as unknown as StepsContent;
    await settle();
    expect(errors).toHaveLength(2);
    expect(errors[1]).toBeInstanceOf(TypeError);
    input.value = (() => Promise.resolve("async")) as unknown as StepsContent;
    await settle();
    expect(errors).toHaveLength(3);
    expect(errors[2]).toBeInstanceOf(TypeError);
    input.value = "recovered";
    await settle();
    expect(host.querySelector(".semi-steps-item-title-text")?.textContent).toBe(
      "recovered",
    );
    expect(errors).toHaveLength(3);
  } finally {
    app.unmount();
    expect(host.childNodes).toHaveLength(0);
    host.remove();
  }
});

test("Steps basic rejects an array icon and immediately releases its created native effects", async () => {
  let active = 0;
  const subscriptions = vi.fn();
  const value = shallowRef(0);
  const Probe = defineVaporComponent(() => {
    active++;
    onScopeDispose(() => active--);
    watchEffect(() => subscriptions(value.value));
    return <i>not accepted</i>;
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Steps type="basic">
        {() => <Step icon={() => [<Probe />]} title="title" />}
      </Steps>
    )),
  );
  try {
    await settle();
    expect(fixture.host.querySelector("i")).toBeNull();
    expect(active).toBe(0);
    const calls = subscriptions.mock.calls.length;
    value.value++;
    await settle();
    expect(subscriptions).toHaveBeenCalledTimes(calls);
  } finally {
    fixture.unmount();
  }
  expect(active).toBe(0);
});
test.each(["fill", "basic"] as const)(
  "Steps %s invalid async icon renderer reports and releases its scope",
  async (type) => {
    const host = document.createElement("div");
    document.body.append(host);
    const errors: unknown[] = [];
    let active = 0;
    const icon = (() => {
      active++;
      onScopeDispose(() => active--);
      return Promise.reject(new Error("async icon"));
    }) as unknown as StepsContent;
    const app = createVaporApp(
      defineVaporComponent(() => (
        <Steps type={type}>{() => <Step icon={icon} title="title" />}</Steps>
      )),
    );
    app.config.errorHandler = (error) => errors.push(error);
    const warnings: string[] = [];
    app.config.warnHandler = (warning) => warnings.push(warning);
    try {
      app.mount(host);
      await settle();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBeInstanceOf(TypeError);
      expect(active).toBe(0);
      expect(warnings).toEqual([
        "Vapor component setup() returned non-block value, and has no render function.",
      ]);
    } finally {
      app.unmount();
      host.remove();
    }
  },
);

test("Steps fill internal Col uses zero gutter without changing basic/nav outer Grid inheritance", async () => {
  const type = shallowRef<"fill" | "basic" | "nav">("basic");
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Row gutter={20}>
        {() => (
          <Steps type={type.value}>
            {() => (
              <Step
                title={() => (
                  <Col className="gutter-probe">{() => <span>title</span>}</Col>
                )}
              />
            )}
          </Steps>
        )}
      </Row>
    )),
  );
  try {
    for (const mode of ["basic", "fill", "nav", "basic"] as const) {
      type.value = mode;
      await settle();
      const col = fixture.host.querySelector<HTMLElement>(".gutter-probe")!;
      expect(col.style.paddingLeft).toBe(mode === "fill" ? "" : "10px");
      expect(col.style.paddingRight).toBe(mode === "fill" ? "" : "10px");
    }
  } finally {
    fixture.unmount();
  }
});
test("Steps renderer partial failure immediately releases created child effects", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  let active = 0;
  const errors: unknown[] = [];
  const warnings: string[] = [];
  const Probe = defineVaporComponent(() => {
    active++;
    onScopeDispose(() => active--);
    return <i>partial</i>;
  });
  const renderer = () => {
    void (<Probe />);
    throw new Error("renderer failed");
  };
  const app = createVaporApp(
    defineVaporComponent(() => (
      <Steps type="basic">{() => <Step title={renderer} />}</Steps>
    )),
  );
  app.config.errorHandler = (error) => errors.push(error);
  app.config.warnHandler = (warning) => warnings.push(warning);
  try {
    app.mount(host);
    await settle();
    expect(errors).toHaveLength(1);
    expect((errors[0] as Error).message).toBe("renderer failed");
    expect(active).toBe(0);
    expect(warnings).toEqual([
      "Vapor component setup() returned non-block value, and has no render function.",
    ]);
  } finally {
    app.unmount();
    host.remove();
  }
  expect(active).toBe(0);
});
