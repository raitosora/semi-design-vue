import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import type { ShallowRef } from "vue";
import { expect, test, vi } from "vitest";
import ConfigProvider from "../../packages/semi-ui-vue/src/components/configProvider/index.js";
import {
  Col,
  Row,
} from "../../packages/semi-ui-vue/src/components/grid/index.js";
import type { RowProps } from "../../packages/semi-ui-vue/src/components/grid/types.js";
import { mountVapor } from "../support/mount-vapor.js";

const settle = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};

test("grid restores defaults, resolves tuple gutters and preserves style precedence", async () => {
  const input = shallowRef<RowProps>({
    gutter: [16, 8],
    type: "flex",
    align: "middle",
    justify: "space-between",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Row {...input.value} id="row" style={{ marginLeft: "9px" }}>
        {() => (
          <Col
            offset={0}
            span={12}
            style={{ paddingLeft: "7px" }}
            xs={{ span: 0, order: 0 }}
          >
            {() => <button>item</button>}
          </Col>
        )}
      </Row>
    )),
  );
  try {
    const row = fixture.host.querySelector<HTMLElement>("#row")!;
    const col = row.querySelector<HTMLElement>(".semi-col")!;
    expect(row.classList.contains("semi-row-flex-middle")).toBe(true);
    expect(row.classList.contains("semi-row-flex-space-between")).toBe(true);
    expect(row.style.marginLeft).toBe("9px");
    expect(row.style.marginRight).toBe("-8px");
    expect(row.style.marginTop).toBe("-4px");
    expect(col.style.paddingLeft).toBe("7px");
    expect(col.style.paddingRight).toBe("8px");
    expect(col.style.paddingTop).toBe("4px");
    expect(col.classList.contains("semi-col-12")).toBe(true);
    expect(col.classList.contains("semi-col-xs-0")).toBe(true);
    expect(col.classList.contains("semi-col-xs-order-0")).toBe(true);
    expect(col.classList.contains("semi-col-offset-0")).toBe(false);
    input.value = {
      gutter: 0,
      type: undefined,
      align: undefined,
      justify: undefined,
    };
    await settle();
    expect(row.className).toBe("semi-row");
    expect(row.style.marginRight).toBe("");
    expect(col.style.paddingRight).toBe("");
    input.value = {};
    await settle();
    expect(row.className).toBe("semi-row");
    expect(col.style.paddingTop).toBe("");
  } finally {
    fixture.unmount();
  }
});

test("responsive gutters use the six fixed media queries, initial snapshot and live priority", async () => {
  const queries = [
    "(max-width: 575px)",
    "(min-width: 576px)",
    "(min-width: 768px)",
    "(min-width: 992px)",
    "(min-width: 1200px)",
    "(min-width: 1600px)",
  ];
  const records: Array<{
    query: string;
    listener?: (event: { matches: boolean }) => void;
    removed: boolean;
  }> = [];
  const media = vi.spyOn(window, "matchMedia").mockImplementation((query) => {
    const record = { query, removed: false } as (typeof records)[number];
    records.push(record);
    return {
      matches: query === queries[2] || query === queries[4],
      addEventListener: (_name: string, listener: EventListener) => {
        record.listener = listener as unknown as (event: {
          matches: boolean;
        }) => void;
      },
      removeEventListener: () => {
        record.removed = true;
      },
    } as unknown as MediaQueryList;
  });
  const input = shallowRef<RowProps>({
    gutter: [
      { xs: 2, md: 12, xl: 20 },
      { xs: 4, md: 0, xl: 14 },
    ],
  });
  let fixture: ReturnType<typeof mountVapor> | undefined;
  try {
    fixture = mountVapor(
      defineVaporComponent(() => (
        <ConfigProvider
          responsiveMap={{
            xs: "custom-xs",
            sm: "custom-sm",
            md: "custom-md",
            lg: "custom-lg",
            xl: "custom-xl",
            xxl: "custom-xxl",
          }}
        >
          {() => (
            <Row {...input.value}>
              {() => <Col>{() => <span>cell</span>}</Col>}
            </Row>
          )}
        </ConfigProvider>
      )),
    );
    const row = fixture.host.querySelector<HTMLElement>(".semi-row")!;
    const col = fixture.host.querySelector<HTMLElement>(".semi-col")!;
    expect(records.map((record) => record.query)).toEqual(queries);
    expect(row.style.marginLeft).toBe("-10px");
    expect(row.style.marginTop).toBe("-7px");
    expect(col.style.paddingLeft).toBe("10px");
    input.value = { gutter: 30 };
    await settle();
    expect(row.style.marginLeft).toBe("-15px");
    input.value = {
      gutter: [
        { xs: 2, md: 12, xl: 20 },
        { xs: 4, md: 0, xl: 14 },
      ],
    };
    await settle();
    expect(row.style.marginLeft).toBe("-10px");
    records[4]!.listener!({ matches: false });
    await settle();
    expect(row.style.marginLeft).toBe("-6px");
    expect(row.style.marginTop).toBe("");
    records[2]!.listener!({ matches: false });
    records[0]!.listener!({ matches: true });
    await settle();
    expect(row.style.marginLeft).toBe("-1px");
    expect(row.style.marginTop).toBe("-2px");
    input.value = { gutter: [{ xs: 0, md: 22 }, -4] };
    await settle();
    expect(row.style.marginLeft).toBe("");
    expect(col.style.paddingLeft).toBe("");
    expect(row.style.marginTop).toBe("");
  } finally {
    fixture?.unmount();
    expect(records.every((record) => record.removed)).toBe(true);
    media.mockRestore();
  }
});

test("each Row owns and releases its media subscriptions across conditional remounts", async () => {
  const records: Array<{ removed: boolean; query: string }> = [];
  const media = vi.spyOn(window, "matchMedia").mockImplementation((query) => {
    const record = { query, removed: false };
    records.push(record);
    const firstRow = records.length <= 6;
    return {
      matches:
        query === (firstRow ? "(max-width: 575px)" : "(min-width: 1200px)"),
      addEventListener: () => {},
      removeEventListener: () => {
        record.removed = true;
      },
    } as unknown as MediaQueryList;
  });
  const visible = ref(true);
  let fixture: ReturnType<typeof mountVapor> | undefined;
  try {
    fixture = mountVapor(
      defineVaporComponent(() => (
        <section>
          <Row data-row="first" gutter={{ xs: 4, xl: 20 }}>
            {() => <Col />}
          </Row>
          {visible.value && (
            <Row data-row="second" gutter={{ xs: 4, xl: 20 }}>
              {() => <Col />}
            </Row>
          )}
        </section>
      )),
    );
    expect(records).toHaveLength(12);
    expect(
      fixture.host.querySelector<HTMLElement>('[data-row="first"]')!.style
        .marginLeft,
    ).toBe("-2px");
    expect(
      fixture.host.querySelector<HTMLElement>('[data-row="second"]')!.style
        .marginLeft,
    ).toBe("-10px");
    visible.value = false;
    await settle();
    expect(records.slice(0, 6).every((record) => !record.removed)).toBe(true);
    expect(records.slice(6, 12).every((record) => record.removed)).toBe(true);
    visible.value = true;
    await settle();
    expect(records).toHaveLength(18);
  } finally {
    fixture?.unmount();
    expect(records.every((record) => record.removed)).toBe(true);
    media.mockRestore();
  }
});

test("grid keeps nested context separate and keyed slot state through updates", async () => {
  const outer = shallowRef<RowProps>({ gutter: [24, 12] });
  const inner = shallowRef<RowProps>({ gutter: 4 });
  const items = shallowRef(["a", "b"]);
  let mounts = 0;
  let unmounts = 0;
  const Item = defineVaporComponent<{ id: string }>(
    (props) => {
      const clicks = ref(0);
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return (
        <button data-id={props.id} onClick={() => clicks.value++}>
          {props.id}:{clicks.value}
        </button>
      );
    },
    { props: ["id"] },
  );
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Row {...outer.value} data-case="outer">
        {() => (
          <>
            <Col data-case="parent">
              {() => (
                <Row {...inner.value} data-case="inner">
                  {() => (
                    <Col data-case="child">
                      {() => (
                        <For getKey={(id: string) => id} in={items.value}>
                          {{
                            default: (id: ShallowRef<unknown>) => (
                              <Item id={id.value as string} />
                            ),
                          }}
                        </For>
                      )}
                    </Col>
                  )}
                </Row>
              )}
            </Col>
            <Col data-case="sibling">{() => <span>other</span>}</Col>
          </>
        )}
      </Row>
    )),
  );
  try {
    const parent = fixture.host.querySelector<HTMLElement>(
      '[data-case="parent"]',
    )!;
    const child = fixture.host.querySelector<HTMLElement>(
      '[data-case="child"]',
    )!;
    const sibling = fixture.host.querySelector<HTMLElement>(
      '[data-case="sibling"]',
    )!;
    expect(parent.style.paddingLeft).toBe("12px");
    expect(parent.style.paddingTop).toBe("6px");
    expect(child.style.paddingLeft).toBe("2px");
    expect(child.style.paddingTop).toBe("");
    const button = child.querySelector<HTMLButtonElement>('[data-id="b"]')!;
    button.click();
    button.focus();
    outer.value = { gutter: [8, 0] };
    inner.value = { gutter: [10, 6] };
    items.value = ["b", "c"];
    await settle();
    expect(parent.style.paddingLeft).toBe("4px");
    expect(sibling.style.paddingLeft).toBe("4px");
    expect(child.style.paddingLeft).toBe("5px");
    expect(child.style.paddingTop).toBe("3px");
    expect(child.querySelector('[data-id="b"]')).toBe(button);
    expect(button.textContent).toBe("b:1");
    expect(document.activeElement).toBe(button);
    expect(mounts).toBe(3);
    expect(unmounts).toBe(1);
  } finally {
    fixture.unmount();
  }
});

test("Col updates base and breakpoint classes without retaining removed props", async () => {
  const input = shallowRef({
    span: 24 as number | undefined,
    offset: 2 as number | undefined,
    order: 3 as number | undefined,
    push: 4 as number | undefined,
    pull: 5 as number | undefined,
    xs: 12 as number | { span?: number; order?: number } | undefined,
    md: { span: 8, order: 0 } as { span?: number; order?: number } | undefined,
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Row>
        {() => (
          <Col
            {...input.value}
            className="extra"
            data-id="column"
            prefixCls="custom"
          >
            {() => <span>content</span>}
          </Col>
        )}
      </Row>
    )),
  );
  try {
    const col = fixture.host.querySelector<HTMLElement>('[data-id="column"]')!;
    expect(col.classList.contains("custom-col-24")).toBe(true);
    for (const value of [
      "order-3",
      "offset-2",
      "push-4",
      "pull-5",
      "xs-12",
      "md-8",
      "md-order-0",
    ]) {
      expect(col.classList.contains(`custom-col-${value}`)).toBe(true);
    }
    expect(col.classList.contains("extra")).toBe(true);
    input.value = {
      span: 0,
      offset: 0,
      order: 0,
      push: 0,
      pull: 0,
      xs: { span: 0, order: 0 },
      md: undefined,
    };
    await settle();
    expect(col.classList.contains("custom-col-0")).toBe(true);
    expect(col.classList.contains("custom-col-xs-0")).toBe(true);
    expect(col.classList.contains("custom-col-xs-order-0")).toBe(true);
    expect(col.classList.contains("custom-col-md-8")).toBe(false);
    for (const value of [
      "order-3",
      "offset-2",
      "push-4",
      "pull-5",
      "order-0",
      "offset-0",
      "push-0",
      "pull-0",
    ]) {
      expect(col.classList.contains(`custom-col-${value}`)).toBe(false);
    }
  } finally {
    fixture.unmount();
  }
});

test("Col outside Row reports the upstream usage error", () => {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createVaporApp(defineVaporComponent(() => <Col />));
  app.config.warnHandler = () => {};
  try {
    expect(() => app.mount(host)).toThrow(
      "please make sure <Col> inside <Row>",
    );
  } finally {
    host.remove();
  }
});
