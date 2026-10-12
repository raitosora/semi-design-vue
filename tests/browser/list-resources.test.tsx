import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import List from "../../packages/semi-ui-vue/src/components/list/index.js";
import type { ListProps } from "../../packages/semi-ui-vue/src/components/list/types.js";
import { mountVapor } from "../support/mount-vapor.js";

test("List Grid collaboration releases media listeners on grid removal and final unmount", async () => {
  const records: Array<{
    listener?: (event: { matches: boolean }) => void;
    removed: number;
  }> = [];
  const match = vi.spyOn(window, "matchMedia").mockImplementation(() => {
    const entry: (typeof records)[number] = { removed: 0 };
    records.push(entry);
    return {
      matches: true,
      addEventListener: (_: string, listener: EventListener) => {
        entry.listener = listener as unknown as (event: {
          matches: boolean;
        }) => void;
      },
      removeEventListener: () => {
        entry.removed++;
      },
    } as unknown as MediaQueryList;
  });
  const props = shallowRef<ListProps>({ grid: { gutter: { xs: 4, xl: 20 } } });
  let fixture: ReturnType<typeof mountVapor> | undefined;
  try {
    fixture = mountVapor(
      defineVaporComponent(() => (
        <List {...props.value}>{() => <List.Item main="grid" />}</List>
      )),
    );
    expect(records).toHaveLength(6);
    expect(
      fixture.host.querySelector<HTMLElement>(".semi-row-flex")?.style
        .marginLeft,
    ).toBe("-10px");
    props.value = {};
    await nextTick();
    expect(records.every((record) => record.removed === 1)).toBe(true);
    for (const record of records) record.listener!({ matches: false });
    await nextTick();
    expect(fixture.host.querySelector(".semi-row-flex")).toBeNull();
    expect(fixture.host.querySelector("li")?.textContent).toBe("grid");
    props.value = { grid: {} };
    await nextTick();
    expect(records).toHaveLength(12);
    fixture.unmount();
    fixture = undefined;
    expect(records.every((record) => record.removed === 1)).toBe(true);
    for (const record of records) record.listener!({ matches: true });
    await nextTick();
  } finally {
    fixture?.unmount();
    match.mockRestore();
  }
});
