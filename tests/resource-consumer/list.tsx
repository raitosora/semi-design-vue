import { createVaporApp, nextTick, onScopeDispose, ref } from "vue";
import { List, ConfigProvider } from "semi-ui-vue";
import DefaultList, { List as NamedList } from "semi-ui-vue/list";
import Item, { ListItem } from "semi-ui-vue/list/item";
import "semi-ui-vue/styles/components/list.css";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkListConsumer() {
  assert(
    List === DefaultList &&
      List === NamedList &&
      List.Item === Item &&
      Item === ListItem,
    "List public entry identity failed",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const originalDir = document.body.getAttribute("dir");
  const label = ref("Packed"),
    loading = ref(false),
    alive = ref(true),
    grid = ref(false);
  const direction = ref<"ltr" | "rtl">("ltr");
  let mounts = 0,
    disposals = 0,
    listClicks = 0,
    itemClicks = 0;
  const owned = () => {
    mounts++;
    onScopeDispose(() => {
      disposals++;
    });
    return <input data-list-owned="" value={label.value} />;
  };
  const records = [
    { id: 1, title: "First" },
    { id: 2, title: "Second" },
  ];
  const app = createVaporApp(() => (
    <ConfigProvider direction={direction.value}>
      {() => (
        <section>
          {alive.value && (
            <List
              bordered
              data-packed-list=""
              dataSource={records}
              grid={grid.value ? { span: 12, gutter: 16 } : undefined}
              header={label.value}
              loading={loading.value}
              onClick={() => {
                listClicks++;
              }}
              renderItem={(record) => (
                <List.Item key={record.id} main={record.title} />
              )}
            >
              {() => (
                <List.Item
                  data-packed-tail=""
                  extra={() => <button data-list-action="">Action</button>}
                  onClick={() => {
                    itemClicks++;
                  }}
                >
                  {owned}
                </List.Item>
              )}
            </List>
          )}
          <List data-packed-empty="" />
          <List data-packed-declared="">{() => <></>}</List>
          <List data-packed-safe="" header="<img src=x>" />
        </section>
      )}
    </ConfigProvider>
  ));
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    const root = host.querySelector<HTMLElement>("[data-packed-list]")!;
    assert(
      root.querySelectorAll("ul.semi-list-items > li").length === 3,
      "List data and declared content must append",
    );
    assert(
      host.querySelector("[data-packed-empty] .semi-list-empty")?.textContent
        ?.length,
      "List locale empty text missing",
    );
    assert(
      !host.querySelector("[data-packed-empty] .semi-empty"),
      "List introduced public Empty dependency",
    );
    assert(
      !host.querySelector("[data-packed-declared] .semi-list-empty"),
      "Declared empty slot incorrectly used fallback",
    );
    assert(
      host.querySelector("[data-packed-safe] .semi-list-header")
        ?.textContent === "<img src=x>" &&
        !host.querySelector("[data-packed-safe] img"),
      "List header text is not escaped",
    );
    assert(
      !root.hasAttribute("role") && !root.hasAttribute("aria-live"),
      "List invented ARIA protocol",
    );
    const input = root.querySelector<HTMLInputElement>("[data-list-owned]")!;
    input.focus();
    label.value = "Updated";
    loading.value = true;
    direction.value = "rtl";
    await nextTick();
    assert(
      root.querySelector("[data-list-owned]") === input &&
        input.value === "Updated" &&
        document.activeElement === input &&
        mounts === 1 &&
        disposals === 0,
      "List loading/update replaced owned content",
    );
    assert(
      root.querySelector(".semi-spin-large") && root.closest(".semi-rtl"),
      "List Spin/context integration missing",
    );
    root.querySelector<HTMLButtonElement>("[data-list-action]")!.click();
    root.querySelector<HTMLLIElement>(".semi-list-items > li")!.click();
    assert(
      itemClicks === 1 && listClicks === 1,
      "List item override and context event routing differ",
    );
    loading.value = false;
    grid.value = true;
    await nextTick();
    assert(
      root.querySelector(".semi-row-flex .semi-col-12 > li.semi-list-item") &&
        !root.querySelector("ul.semi-list-items"),
      "List grid wrappers missing",
    );
    alive.value = false;
    await nextTick();
    assert(
      !host.querySelector("[data-packed-list]") &&
        Number(disposals) === Number(mounts),
      "List removal retained owned scopes",
    );
    alive.value = true;
    await nextTick();
    assert(
      host.querySelector("[data-list-owned]") !== input,
      "List remount reused disposed DOM",
    );
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0 && Number(disposals) === Number(mounts),
      "List unmount retained DOM or scopes",
    );
    label.value = "Disposed";
    await nextTick();
    assert(host.childNodes.length === 0, "List detached update revived DOM");
    return "list consumer passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
    if (originalDir === null) document.body.removeAttribute("dir");
    else document.body.setAttribute("dir", originalDir);
  }
}
