import {
  defineVaporComponent,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
} from "vue";
import type { ShallowRef } from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test } from "vitest";
import Skeleton from "../../packages/semi-ui-vue/src/components/skeleton/index.js";
import type { SkeletonProps } from "../../packages/semi-ui-vue/src/components/skeleton/index.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Skeleton switches owned placeholder and content without a content wrapper", async () => {
  const props = shallowRef<SkeletonProps>({});
  const text = ref("first");
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Skeleton {...props.value} data-probe="skeleton">
        {{
          placeholder: () => <Skeleton.Title data-probe="placeholder" />,
          default: () => <button data-probe="content">{text.value}</button>,
        }}
      </Skeleton>
    )),
  );
  try {
    expect(
      fixture.host.querySelector("[data-probe=placeholder]"),
    ).not.toBeNull();
    expect(fixture.host.querySelector("[data-probe=content]")).toBeNull();
    const loadingRoot = fixture.host.querySelector("[data-probe=skeleton]")!;
    expect(loadingRoot.classList.contains("semi-skeleton")).toBe(true);
    props.value = { loading: false };
    await nextTick();
    const content = fixture.host.querySelector("[data-probe=content]")!;
    expect(content.parentElement).toBe(fixture.host);
    expect(fixture.host.querySelector("[data-probe=skeleton]")).toBeNull();
    text.value = "second";
    await nextTick();
    expect(content.textContent).toBe("second");
    props.value = { loading: true, active: true };
    await nextTick();
    expect(fixture.host.querySelector("[data-probe=content]")).toBeNull();
    expect(fixture.host.querySelector(".semi-skeleton-active")).not.toBeNull();
    props.value = { loading: undefined, active: undefined };
    await nextTick();
    expect(
      fixture.host.querySelector("[data-probe=placeholder]"),
    ).not.toBeNull();
    expect(fixture.host.querySelector(".semi-skeleton-active")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("Skeleton static items use upstream roots and dynamic classes", async () => {
  const rows = ref(4);
  const size = ref<"medium" | "large">("medium");
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <div>
        <Skeleton.Avatar data-probe="avatar" shape="square" size={size.value} />
        <Skeleton.Title data-probe="title" />
        <Skeleton.Button data-probe="button" />
        <Skeleton.Image data-probe="image" />
        <Skeleton.Paragraph data-probe="paragraph" rows={rows.value} />
      </div>
    )),
  );
  try {
    const avatar = fixture.host.querySelector("[data-probe=avatar]")!;
    expect(avatar.tagName).toBe("DIV");
    expect(avatar.classList.contains("semi-skeleton-avatar-medium")).toBe(true);
    expect(avatar.classList.contains("semi-skeleton-avatar-square")).toBe(true);
    expect(fixture.host.querySelector("[data-probe=title]")?.tagName).toBe(
      "DIV",
    );
    expect(fixture.host.querySelector("[data-probe=button]")?.tagName).toBe(
      "DIV",
    );
    expect(fixture.host.querySelector("[data-probe=image]")?.tagName).toBe(
      "DIV",
    );
    expect(fixture.host.querySelector("[data-probe=paragraph]")?.tagName).toBe(
      "UL",
    );
    expect(
      fixture.host.querySelectorAll("[data-probe=paragraph] li"),
    ).toHaveLength(4);
    size.value = "large";
    rows.value = 0;
    await nextTick();
    expect(avatar.classList.contains("semi-skeleton-avatar-large")).toBe(true);
    expect(avatar.classList.contains("semi-skeleton-avatar-medium")).toBe(
      false,
    );
    expect(
      fixture.host.querySelectorAll("[data-probe=paragraph] li"),
    ).toHaveLength(0);
  } finally {
    fixture.unmount();
  }
});

test("Skeleton loading root forwards attributes and drops them with its wrapper", async () => {
  const props = shallowRef<SkeletonProps>({
    active: true,
    class: "native",
    className: "compat",
    id: "first",
    role: "status",
    style: { width: "240px" },
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Skeleton {...props.value} aria-label="loading data">
        {{
          placeholder: () => <Skeleton.Button />,
          default: () => <span data-content="">ready</span>,
        }}
      </Skeleton>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-skeleton")!;
    expect(root.id).toBe("first");
    expect(root.classList.contains("native")).toBe(true);
    expect(root.classList.contains("compat")).toBe(true);
    expect(root.getAttribute("aria-label")).toBe("loading data");
    expect(root.getAttribute("role")).toBe("status");
    expect(root.getAttribute("x-semi-prop")).toBe("placeholder");
    expect(root.style.width).toBe("240px");
    props.value = {
      active: false,
      class: "next",
      className: "next-compat",
      id: undefined,
      role: undefined,
      style: { width: "0px" },
    };
    await nextTick();
    const updated = fixture.host.querySelector<HTMLElement>(".semi-skeleton")!;
    expect(updated.hasAttribute("id")).toBe(false);
    expect(updated.hasAttribute("role")).toBe(false);
    expect(updated.classList.contains("native")).toBe(false);
    expect(updated.classList.contains("next")).toBe(true);
    expect(updated.classList.contains("next-compat")).toBe(true);
    expect(updated.classList.contains("semi-skeleton-active")).toBe(false);
    expect(updated.style.width).toBe("0px");
    props.value = { loading: false, className: "absent" };
    await nextTick();
    expect(fixture.host.querySelector(".semi-skeleton")).toBeNull();
    expect(fixture.host.querySelector("[data-content]")?.parentElement).toBe(
      fixture.host,
    );
  } finally {
    fixture.unmount();
  }
});

test("Skeleton items update prefix, shape, rows and native attributes", async () => {
  const item = shallowRef<{
    prefixCls?: string;
    type?: string;
    shape?: "circle" | "square";
    size?: "small" | "default";
    className?: string;
    style?: { width: string };
    title?: string;
  }>({
    prefixCls: "custom-skeleton",
    type: "avatar",
    shape: "circle",
    size: "small",
    className: "outer",
    style: { width: "17px" },
    title: "avatar",
  });
  const rows = ref<number | undefined>(1);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <div>
        <Skeleton.Avatar {...item.value} data-avatar="" />
        <Skeleton.Paragraph
          class="native"
          className="named"
          data-paragraph=""
          rows={rows.value}
          style={{ width: "250px" }}
        />
      </div>
    )),
  );
  try {
    const avatar = fixture.host.querySelector<HTMLElement>("[data-avatar]")!;
    const paragraph =
      fixture.host.querySelector<HTMLElement>("[data-paragraph]")!;
    expect(avatar.classList.contains("custom-skeleton-avatar-small")).toBe(
      true,
    );
    expect(avatar.classList.contains("custom-skeleton-avatar-circle")).toBe(
      true,
    );
    expect(avatar.classList.contains("outer")).toBe(true);
    expect(avatar.getAttribute("title")).toBe("avatar");
    expect(avatar.style.width).toBe("17px");
    expect(paragraph.classList.contains("native")).toBe(true);
    expect(paragraph.classList.contains("named")).toBe(true);
    expect(paragraph.querySelectorAll("li")).toHaveLength(1);
    item.value = { ...item.value, shape: "square", size: "default" };
    rows.value = 2;
    await nextTick();
    expect(avatar.classList.contains("custom-skeleton-avatar-small")).toBe(
      false,
    );
    expect(avatar.classList.contains("custom-skeleton-avatar-default")).toBe(
      true,
    );
    expect(avatar.classList.contains("custom-skeleton-avatar-square")).toBe(
      true,
    );
    expect(paragraph.querySelectorAll("li")).toHaveLength(2);
    item.value = { ...item.value, type: "custom" };
    await nextTick();
    expect(avatar.classList.contains("custom-skeleton-custom")).toBe(true);
    expect(avatar.classList.contains("custom-skeleton-avatar-square")).toBe(
      false,
    );
    item.value = { ...item.value, type: undefined, prefixCls: undefined };
    await nextTick();
    expect(avatar.classList.contains("semi-skeleton-avatar-default")).toBe(
      true,
    );
    expect(avatar.classList.contains("semi-skeleton-avatar-square")).toBe(true);
    const { type: _removedType, ...withoutType } = item.value;
    item.value = withoutType;
    await nextTick();
    expect(avatar.classList.contains("semi-skeleton-avatar-default")).toBe(
      true,
    );
    rows.value = undefined;
    await nextTick();
    expect(paragraph.querySelectorAll("li")).toHaveLength(4);
  } finally {
    fixture.unmount();
  }
});

test("Skeleton toggles nested fragment/list content with remount and focus semantics", async () => {
  let mounted = 0;
  let unmounted = 0;
  const loading = ref(true);
  const labels = shallowRef(["A", "B"]);
  const Input = defineVaporComponent(() => {
    onMounted(() => mounted++);
    onUnmounted(() => unmounted++);
    return <input data-stateful="" />;
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Skeleton loading={loading.value}>
        {{
          placeholder: () => (
            <>
              <Skeleton.Avatar />
              <Skeleton.Paragraph rows={2} />
            </>
          ),
          default: () => (
            <>
              <Input />
              <For getKey={(value: string) => value} in={labels.value}>
                {{
                  default: (value: ShallowRef<unknown>) => (
                    <span data-list="">{value.value as string}</span>
                  ),
                }}
              </For>
              <Skeleton loading={false}>
                {() => <strong data-nested="">nested</strong>}
              </Skeleton>
            </>
          ),
        }}
      </Skeleton>
    )),
  );
  try {
    expect(mounted).toBe(0);
    loading.value = false;
    await nextTick();
    const input =
      fixture.host.querySelector<HTMLInputElement>("[data-stateful]")!;
    input.value = "draft";
    input.focus();
    expect(document.activeElement).toBe(input);
    labels.value = ["B", "C"];
    await nextTick();
    expect(
      [...fixture.host.querySelectorAll("[data-list]")].map(
        (node) => node.textContent,
      ),
    ).toEqual(["B", "C"]);
    expect(fixture.host.querySelector("[data-nested]")?.textContent).toBe(
      "nested",
    );
    expect(mounted).toBe(1);
    loading.value = true;
    await nextTick();
    expect(unmounted).toBe(1);
    expect(fixture.host.querySelector("[data-stateful]")).toBeNull();
    expect(document.activeElement).not.toBe(input);
    loading.value = false;
    await nextTick();
    expect(mounted).toBe(2);
    expect(
      fixture.host.querySelector<HTMLInputElement>("[data-stateful]")?.value,
    ).toBe("");
    expect(
      fixture.host.querySelectorAll(".semi-skeleton-paragraph li"),
    ).toHaveLength(0);
  } finally {
    fixture.unmount();
  }
  expect(unmounted).toBe(2);
});

test("a wrapper preserves conditional slot ownership across quick toggles", async () => {
  const loading = ref(true);
  const visible = ref(true);
  const text = ref("one");
  const Wrapped = defineVaporComponent(() => (
    <Skeleton active loading={loading.value}>
      {{
        placeholder: () => (
          <>
            <Skeleton.Title />
            <Skeleton.Paragraph rows={0} />
          </>
        ),
        default: () => (
          <>
            <span v-if={visible.value} data-conditional="">
              {text.value}
            </span>
            <em data-sibling="">sibling</em>
          </>
        ),
      }}
    </Skeleton>
  ));
  const fixture = mountVapor(defineVaporComponent(() => <Wrapped />));
  try {
    loading.value = false;
    await nextTick();
    expect(fixture.host.querySelector("[data-conditional]")?.textContent).toBe(
      "one",
    );
    expect(fixture.host.querySelector("[data-sibling]")).not.toBeNull();
    visible.value = false;
    text.value = "two";
    await nextTick();
    expect(fixture.host.querySelector("[data-conditional]")).toBeNull();
    loading.value = true;
    loading.value = false;
    await nextTick();
    visible.value = true;
    await nextTick();
    expect(fixture.host.querySelector("[data-conditional]")?.textContent).toBe(
      "two",
    );
    expect(fixture.host.querySelector(".semi-skeleton")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("native-only attribute updates reach the loading root and standalone item", async () => {
  const rootAttrs = shallowRef<{
    title?: string;
    "data-stage"?: string;
  }>({ title: "before", "data-stage": "one" });
  const itemAttrs = shallowRef<{
    title?: string;
    "aria-label"?: string;
  }>({ title: "item before", "aria-label": "first" });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <div>
        <Skeleton {...rootAttrs.value}>
          {{ placeholder: () => <Skeleton.Title {...itemAttrs.value} /> }}
        </Skeleton>
      </div>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-skeleton")!;
    const item = fixture.host.querySelector<HTMLElement>(
      ".semi-skeleton-title",
    )!;
    expect(root.title).toBe("before");
    expect(item.title).toBe("item before");
    rootAttrs.value = { title: "after", "data-stage": "two" };
    itemAttrs.value = { title: "item after", "aria-label": "second" };
    await nextTick();
    expect(root.title).toBe("after");
    expect(root.getAttribute("data-stage")).toBe("two");
    expect(item.title).toBe("item after");
    expect(item.getAttribute("aria-label")).toBe("second");
    rootAttrs.value = { title: undefined, "data-stage": undefined };
    itemAttrs.value = { title: undefined, "aria-label": undefined };
    await nextTick();
    expect(root.hasAttribute("title")).toBe(false);
    expect(root.hasAttribute("data-stage")).toBe(false);
    expect(item.hasAttribute("title")).toBe(false);
    expect(item.hasAttribute("aria-label")).toBe(false);
  } finally {
    fixture.unmount();
  }
});
