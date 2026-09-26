import {
  defineVaporComponent,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  type ShallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test, vi } from "vitest";
import Progress from "../../packages/semi-ui-vue/src/components/progress/index.js";
import type { ProgressProps } from "../../packages/semi-ui-vue/src/components/progress/index.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Progress scalar format preserves numbers, empty nodes, HTML text and lazy visibility", async () => {
  const format = vi.fn((percent: number) => `<img src=x> ${percent}`);
  const input = shallowRef<ProgressProps>({
    percent: 25,
    format,
    motion: false,
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Progress {...input.value} />),
  );
  try {
    expect(format).not.toHaveBeenCalled();
    input.value = { ...input.value, showInfo: true };
    await nextTick();
    expect(fixture.host.textContent).toBe("<img src=x> 25");
    expect(fixture.host.querySelector("img")).toBeNull();
    for (const value of [0, 9.5, null, undefined, true, false, ""]) {
      input.value = { ...input.value, format: () => value };
      await nextTick();
      expect(fixture.host.textContent).toBe(
        typeof value === "number" ? String(value) : "",
      );
    }
    input.value = { ...input.value, format: undefined };
    await nextTick();
    expect(fixture.host.textContent).toBe("25%");
  } finally {
    fixture.unmount();
  }
});

test("Progress native format slot preserves scoped refs, fragments, wrappers, lists and nested ownership", async () => {
  let mounted = 0;
  let unmounted = 0;
  const Wrapper = defineVaporComponent(() => {
    onMounted(() => mounted++);
    onUnmounted(() => unmounted++);
    return (
      <strong>
        <slot />
      </strong>
    );
  });
  const percent = ref(20);
  const mode = ref<"line" | "circle">("line");
  const show = ref(true);
  const content = ref(true);
  const listed = shallowRef(["a", "b"]);
  const format = vi.fn(() => "ignored");
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <>
        <Progress
          format={format}
          motion={false}
          percent={percent.value}
          showInfo={show.value}
          type={mode.value}
          v-slots={{
            format: (scope) => (
              <>
                {content.value ? (
                  <Wrapper>
                    {() => (
                      <>
                        {scope.percent.value}
                        <i> units</i>
                      </>
                    )}
                  </Wrapper>
                ) : null}
                <For getKey={(item: string) => item} in={listed.value}>
                  {{
                    default: (item: ShallowRef<unknown>) => (
                      <em>{item.value as string}</em>
                    ),
                  }}
                </For>
                <Progress motion={false} percent={scope.percent.value / 2} />
              </>
            ),
          }}
        />
        <span>outside</span>
      </>
    )),
  );
  try {
    expect(format).not.toHaveBeenCalled();
    expect(mounted).toBe(1);
    expect(fixture.host.querySelector("strong")!.textContent).toBe("20 units");
    expect(
      [...fixture.host.querySelectorAll('[role="progressbar"]')].map((node) =>
        node.getAttribute("aria-valuenow"),
      ),
    ).toEqual(["20", "10"]);
    percent.value = 80;
    listed.value = ["b", "c", "a"];
    await nextTick();
    expect(fixture.host.querySelector("strong")!.textContent).toBe("80 units");
    expect(
      [...fixture.host.querySelectorAll("em")].map((node) => node.textContent),
    ).toEqual(["b", "c", "a"]);
    expect(mounted).toBe(1);
    content.value = false;
    await nextTick();
    expect(unmounted).toBe(1);
    content.value = true;
    mode.value = "circle";
    await nextTick();
    expect(
      fixture.host.querySelector(".semi-progress-circle-text strong")!
        .textContent,
    ).toBe("80 units");
    expect(mounted).toBe(2);
    show.value = false;
    await nextTick();
    expect(unmounted).toBe(2);
    expect(fixture.host.querySelector("strong")).toBeNull();
    show.value = true;
    await nextTick();
    expect(mounted).toBe(3);
  } finally {
    fixture.unmount();
  }
  expect(unmounted).toBe(3);
  expect(fixture.host.childNodes).toHaveLength(0);
});

test("Progress conditional mount and dynamic format slot replacement retain correct ownership", async () => {
  const show = ref(true);
  const custom = ref(false);
  const percent = ref(10);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <>
        {show.value ? (
          <Progress
            motion={false}
            percent={percent.value}
            showInfo
            v-slots={
              custom.value
                ? { format: ({ percent }) => <b>{percent.value}</b> }
                : {}
            }
          />
        ) : null}
      </>
    )),
  );
  try {
    expect(fixture.host.textContent).toBe("10%");
    custom.value = true;
    await nextTick();
    expect(fixture.host.querySelector("b")!.textContent).toBe("10");
    percent.value = 35;
    await nextTick();
    expect(fixture.host.querySelector("b")!.textContent).toBe("35");
    custom.value = false;
    await nextTick();
    expect(fixture.host.querySelector("b")).toBeNull();
    expect(fixture.host.textContent).toBe("35%");
    show.value = false;
    await nextTick();
    expect(fixture.host.children).toHaveLength(0);
    show.value = true;
    await nextTick();
    expect(fixture.host.textContent).toBe("35%");
  } finally {
    fixture.unmount();
  }
});
