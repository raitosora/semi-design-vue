import {
  createTextNode,
  createVaporApp,
  defineVaporComponent,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  onScopeDispose,
  watchEffect,
  provide,
  ref,
  shallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test, vi } from "vitest";
import Input from "../../packages/semi-ui-vue/src/components/input/Input.js";
import { nativeInputContent } from "../../packages/semi-ui-vue/src/components/input/input-render.js";
import type { InputContent } from "../../packages/semi-ui-vue/src/components/input/input-types.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Input content renderer owns conditional fragments, replacements and injected context", async () => {
  const shown = ref(true);
  const text = ref("first");
  let mounts = 0;
  let unmounts = 0;
  const Child = defineVaporComponent(() => {
    const context = inject("input-owner", "missing");
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return (
      <button>
        {context}:{text.value}
      </button>
    );
  });
  const content = shallowRef<InputContent>(() => (
    <>
      <Child v-if={shown.value} />
      <i>tail</i>
    </>
  ));
  const mounted = mountVapor(
    defineVaporComponent(() => {
      provide("input-owner", "provided");
      return (
        <Input addonAfter={() => <b>after</b>} addonBefore={content.value} />
      );
    }),
  );
  try {
    const button = mounted.host.querySelector("button")!;
    expect(mounts).toBe(1);
    button.focus();
    text.value = "updated";
    await nextTick();
    expect(button.textContent).toBe("provided:updated");
    expect(mounted.host.querySelector("button")).toBe(button);
    expect(document.activeElement).toBe(button);
    shown.value = false;
    await nextTick();
    expect(unmounts).toBe(1);
    shown.value = true;
    await nextTick();
    expect(mounts).toBe(2);
    content.value = () => <em>replacement</em>;
    await nextTick();
    expect(unmounts).toBe(2);
    expect(mounted.host.querySelector("em")!.textContent).toBe("replacement");
  } finally {
    mounted.unmount();
  }
  expect(mounted.host.childNodes).toHaveLength(0);
});

test("Input native slots preserve keyed For DOM identity and never execute a content probe", async () => {
  const items = ref(["a", "b", "c"]);
  let mounts = 0;
  let unmounts = 0;
  let renders = 0;
  const Child = defineVaporComponent<{ id: string }, {}, string, {}>(
    (props) => {
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return <button data-key={props.id}>{props.id}</button>;
    },
    { props: ["id"] },
  );
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Input
        addonBefore="ignored"
        v-slots={{
          addonBefore: () => {
            renders++;
            return (
              <>
                <For getKey={(item: string) => item} in={items.value}>
                  {(item: string) => <Child id={item} key={item} />}
                </For>
                <span>tail</span>
              </>
            );
          },
        }}
      />
    )),
  );
  try {
    expect(renders).toBe(1);
    expect(mounts).toBe(3);
    const a = mounted.host.querySelector('[data-key="a"]')!;
    const b = mounted.host.querySelector('[data-key="b"]')!;
    items.value = ["c", "a", "b", "d"];
    await nextTick();
    expect(mounted.host.querySelector('[data-key="a"]')).toBe(a);
    expect(mounted.host.querySelector('[data-key="b"]')).toBe(b);
    expect(mounts).toBe(4);
    expect(unmounts).toBe(0);
    items.value = ["c", "a", "d"];
    await nextTick();
    expect(unmounts).toBe(1);
    expect(mounted.host.textContent).not.toContain("ignored");
  } finally {
    mounted.unmount();
  }
  expect(unmounts).toBe(4);
});

test("Input slot declaration wins even when empty and scalar props retain truthiness, escaping and prefix priority", async () => {
  const suffix = ref(true);
  const props = shallowRef<Record<string, unknown>>({
    prefix: "prefix",
    insetLabel: "inset",
    addonBefore: 0,
    addonAfter: false,
  });
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Input
        {...props.value}
        insetLabelId="inset-id"
        suffix="ignored"
        v-slots={{
          suffix: () => (
            <>
              <span v-if={suffix.value}>slot</span>
            </>
          ),
        }}
      />
    )),
  );
  try {
    const prefix = mounted.host.querySelector(".semi-input-prefix")!;
    expect(prefix.textContent).toBe("prefix");
    expect(prefix.id).toBe("inset-id");
    expect(prefix.classList.contains("semi-input-inset-label")).toBe(true);
    expect(mounted.host.querySelector(".semi-input-prepend")).toBeNull();
    expect(mounted.host.querySelector(".semi-input-append")).toBeNull();
    suffix.value = false;
    await nextTick();
    expect(mounted.host.querySelector(".semi-input-suffix")!.textContent).toBe(
      "",
    );
    expect(
      mounted.host
        .querySelector(".semi-input-wrapper")!
        .classList.contains("semi-input-wrapper__with-suffix"),
    ).toBe(true);
    props.value = {
      prefix: "",
      insetLabel: "<script>text</script>",
      addonBefore: "<b>before</b>",
      addonAfter: 2,
    };
    await nextTick();
    expect(prefix.textContent).toBe("<script>text</script>");
    expect(prefix.querySelector("script")).toBeNull();
    expect(mounted.host.querySelector(".semi-input-prepend")!.textContent).toBe(
      "<b>before</b>",
    );
    expect(mounted.host.querySelector(".semi-input-append")!.textContent).toBe(
      "2",
    );
  } finally {
    mounted.unmount();
  }
});

test("Input renderer scalar arrays and native blocks are preserved without stringifying renderer results", () => {
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Input
        prefix={() => ["text", 7, false, null, [createTextNode("native")]]}
        suffix={() => (
          <>
            <i>first</i>
            <b>second</b>
          </>
        )}
      />
    )),
  );
  try {
    expect(mounted.host.querySelector(".semi-input-prefix")!.textContent).toBe(
      "text7native",
    );
    expect(
      mounted.host.querySelector(".semi-input-suffix")!.children,
    ).toHaveLength(2);
    expect(mounted.host.textContent).not.toContain("[object");
  } finally {
    mounted.unmount();
  }
});

test("Input content rejects asynchronous renderer output with an explicit error", () => {
  const warnings = vi
    .spyOn(console, "warn")
    .mockImplementation(() => undefined);
  try {
    expect(() => nativeInputContent(Promise.resolve("later") as never)).toThrow(
      "Input renderers must return synchronous native content",
    );
  } finally {
    warnings.mockRestore();
  }
});

test("Input invalid consecutive render results release incomplete scopes and recover", async () => {
  const mode = ref("native");
  const watched = ref(0);
  const observed: number[] = [];
  let created = 0;
  let disposed = 0;
  const errors: unknown[] = [];
  const Probe = defineVaporComponent(() => {
    const id = ++created;
    watchEffect(() => {
      void watched.value;
      observed.push(id);
    });
    onScopeDispose(() => disposed++);
    return <b data-probe>native</b>;
  });
  const renderer = (() => {
    if (mode.value === "text") return "recovered";
    const result = <Probe />;
    if (mode.value === "throw") throw new Error("input-render-failure");
    if (mode.value === "object") return { invalid: true };
    if (mode.value === "promise") return Promise.reject(new Error("async"));
    return result;
  }) as unknown as InputContent;
  const host = document.createElement("div");
  document.body.append(host);
  const app = createVaporApp(
    defineVaporComponent(() => <Input prefix={renderer} />),
  );
  app.config.errorHandler = (error) => errors.push(error);
  app.mount(host);
  try {
    for (const next of ["throw", "object", "promise"]) {
      mode.value = next;
      await nextTick();
      await nextTick();
      expect(disposed).toBe(created - 1);
    }
    expect(errors).toHaveLength(3);
    const before = observed.length;
    watched.value++;
    await nextTick();
    expect(observed.slice(before)).toEqual([1]);
    mode.value = "text";
    await nextTick();
    await nextTick();
    expect(host.querySelector(".semi-input-prefix")!.textContent).toBe(
      "recovered",
    );
    expect(disposed).toBe(created);
  } finally {
    app.unmount();
    host.remove();
  }
  expect(disposed).toBe(created);
});
