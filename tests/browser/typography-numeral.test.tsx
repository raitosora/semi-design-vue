import {
  type ShallowRef,
  defineVaporComponent,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  ref,
  shallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test, vi } from "vitest";
import Numeral from "../../packages/semi-ui-vue/src/components/typography/numeral.js";
import type { NumeralProps } from "../../packages/semi-ui-vue/src/components/typography/numeral.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Numeral formats scalar children reactively and restores omitted defaults", async () => {
  const props = shallowRef<NumeralProps>({ children: "1.25", precision: 2 });
  const fixture = mountVapor(
    defineVaporComponent(() => <Numeral {...props.value} id="numeral" />),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>("#numeral")!;
    expect(root.tagName).toBe("SPAN");
    expect(root.textContent).toBe("1.25");
    for (const [value, text] of [
      [0, "0"],
      [null, ""],
      [undefined, ""],
      [false, ""],
      ["", ""],
      [-1.5, "-1"],
    ] as const) {
      props.value = { children: value };
      await nextTick();
      expect(fixture.host.querySelector("#numeral")).toBe(root);
      expect(root.textContent).toBe(text);
    }
    props.value = {
      children: "0.915",
      rule: "percentages",
      precision: 2,
      truncate: "floor",
      className: "formatted",
    };
    await nextTick();
    expect(root.textContent).toBe("91.50%");
    expect(root.classList.contains("formatted")).toBe(true);
    for (const attribute of [
      "rule",
      "precision",
      "truncate",
      "parser",
      "aria-live",
      "role",
    ])
      expect(root.hasAttribute(attribute)).toBe(false);
    props.value = {
      children: "1.6",
      rule: undefined,
      precision: undefined,
      truncate: undefined,
    };
    await nextTick();
    expect(root.textContent).toBe("2");
  } finally {
    fixture.unmount();
  }
});

test("Numeral scoped formatter preserves native list DOM, focus, context and lifecycle", async () => {
  const ids = shallowRef(["a", "b"]);
  const enabled = ref(true);
  const precision = ref(1);
  const mounted = vi.fn();
  const unmounted = vi.fn();
  const Child = defineVaporComponent<{ id: string }>(
    (props) => {
      const context = inject<string>("numeral-context");
      onMounted(() => mounted(props.id));
      onUnmounted(() => unmounted(props.id));
      return (
        <input data-context={context} data-item={props.id} value={props.id} />
      );
    },
    { props: ["id"] },
  );
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provide("numeral-context", "owned");
      return (
        <Numeral component="div" precision={precision.value}>
          {{
            default: ({ format }) => (
              <>
                <span data-raw="true">123.45 untouched</span>
                <span data-total="true">{format(123.45)}</span>
                {enabled.value ? (
                  <For getKey={(id: string) => id} in={ids.value}>
                    {(id: ShallowRef<string>) => (
                      <div data-row={id.value} key={id.value}>
                        <Child id={id.value} />
                        <b>{format(1.25)}</b>
                      </div>
                    )}
                  </For>
                ) : null}
              </>
            ),
          }}
        </Numeral>
      );
    }),
  );
  try {
    const inputA =
      fixture.host.querySelector<HTMLInputElement>('[data-item="a"]')!;
    const inputB =
      fixture.host.querySelector<HTMLInputElement>('[data-item="b"]')!;
    inputA.focus();
    expect(inputA.dataset.context).toBe("owned");
    expect(mounted).toHaveBeenCalledTimes(2);
    expect(fixture.host.querySelector("[data-raw]")!.textContent).toBe(
      "123.45 untouched",
    );
    expect(fixture.host.querySelector("[data-total]")!.textContent).toBe(
      "123.5",
    );
    precision.value = 2;
    await nextTick();
    expect(fixture.host.querySelector("[data-total]")!.textContent).toBe(
      "123.45",
    );
    expect(fixture.host.querySelector('[data-item="a"]')).toBe(inputA);
    expect(document.activeElement).toBe(inputA);
    ids.value = ["b", "c", "a"];
    await nextTick();
    expect(fixture.host.querySelector('[data-item="a"]')).toBe(inputA);
    expect(fixture.host.querySelector('[data-item="b"]')).toBe(inputB);
    expect(
      [...fixture.host.querySelectorAll("[data-row]")].map((element) =>
        element.getAttribute("data-row"),
      ),
    ).toEqual(["b", "c", "a"]);
    expect(mounted).toHaveBeenCalledTimes(3);
    expect(unmounted).toHaveBeenCalledTimes(0);
    ids.value = ["a", "c"];
    await nextTick();
    expect(unmounted).toHaveBeenCalledExactlyOnceWith("b");
    enabled.value = false;
    await nextTick();
    expect(unmounted).toHaveBeenCalledTimes(3);
    enabled.value = true;
    await nextTick();
    expect(mounted).toHaveBeenCalledTimes(5);
    expect(fixture.host.querySelector('[data-item="a"]')).not.toBe(inputA);
  } finally {
    fixture.unmount();
  }
  expect(unmounted).toHaveBeenCalledTimes(5);
});

test("Numeral keeps independent app formatting and renderer ownership without string conversion", async () => {
  const mounted = vi.fn();
  const unmounted = vi.fn();
  const Child = defineVaporComponent(() => {
    onMounted(mounted);
    onUnmounted(unmounted);
    return <button>untouched 1.25</button>;
  });
  const one = mountVapor(
    defineVaporComponent(() => (
      <Numeral children={() => <Child />} precision={2} />
    )),
  );
  const two = mountVapor(
    defineVaporComponent(() => <Numeral children={0.5} rule="percentages" />),
  );
  try {
    expect(one.host.textContent).toBe("untouched 1.25");
    expect(two.host.textContent).toBe("50%");
    expect(mounted).toHaveBeenCalledTimes(1);
  } finally {
    one.unmount();
    two.unmount();
  }
  expect(unmounted).toHaveBeenCalledTimes(1);
});
