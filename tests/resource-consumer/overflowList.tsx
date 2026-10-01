import { createVaporApp, nextTick, ref } from "vue";
import { OverflowList, type OverflowItem } from "semi-ui-vue";
import DefaultOverflowList, {
  OverflowList as NamedOverflowList,
} from "semi-ui-vue/overflowList";
import "semi-ui-vue/styles/components/overflowList.css";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function settle() {
  await nextTick();
  for (let index = 0; index < 6; index++) {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    await nextTick();
  }
}
export async function checkOverflowListConsumer() {
  assert(
    OverflowList === DefaultOverflowList && OverflowList === NamedOverflowList,
    "OverflowList public entries have different identities",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const width = ref(155);
  const items = ref<OverflowItem[]>([
    { key: "a", label: "A" },
    { key: "b", label: "B" },
    { key: "c", label: "C" },
  ]);
  const label = ref("Packed");
  let clicks = 0;
  let notifications = 0;
  const app = createVaporApp(() => (
    <OverflowList
      className="packed-overflow-list"
      collapseFrom="end"
      itemKey="key"
      items={items.value}
      minVisibleItems={0}
      onOverflow={() => notifications++}
      style={{ width: `${width.value}px` }}
      v-slots={{
        visibleItem: (scope) => (
          <button
            data-packed-overflow-index={scope.index}
            data-packed-overflow-item={String(scope.item.key)}
            onClick={() => clicks++}
            style={{
              flex: "0 0 60px",
              width: "60px",
              padding: "0",
              border: "0",
            }}
          >
            {`${label.value} ${String(scope.item.label)}`}
          </button>
        ),
        overflow: (scope) => (
          <button
            data-packed-overflow-count={scope.items.length}
            style={{
              flex: "0 0 30px",
              width: "30px",
              padding: "0",
              border: "0",
            }}
          >
            {`+${scope.items.length}`}
          </button>
        ),
      }}
    />
  ));
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await settle();
    const root = () =>
      host.querySelector<HTMLElement>(".packed-overflow-list")!;
    const visible = () =>
      [
        ...host.querySelectorAll<HTMLButtonElement>(
          "[data-packed-overflow-item]",
        ),
      ].filter(
        (node) =>
          node.getClientRects().length > 0 &&
          !node.closest("[hidden], [inert]") &&
          getComputedStyle(node).visibility === "visible",
      );
    assert(
      Math.abs(root().getBoundingClientRect().width - 155) < 0.1,
      "Packed OverflowList root width differs from requested geometry",
    );
    assert(
      visible()
        .map((node) => node.dataset.packedOverflowItem)
        .join(",") === "a,b",
      "Packed OverflowList did not collapse using real item/overflow width",
    );
    const overflowCount = () =>
      host.querySelector<HTMLButtonElement>("[data-packed-overflow-count]")!;
    assert(
      overflowCount().dataset.packedOverflowCount === "1" &&
        overflowCount().textContent === "+1",
      "Packed collapse overflow scope did not report the current one hidden item",
    );
    const first = visible()[0];
    assert(
      Math.abs(first.getBoundingClientRect().width - 60) < 0.1,
      "Packed OverflowList item measured width differs",
    );
    first.click();
    assert(clicks === 1, "Visible renderer interaction duplicated");
    width.value = 220;
    await settle();
    assert(
      visible().length === 3 && visible()[0] === first,
      "Resize expansion lost stable item identity or failed geometry",
    );
    assert(
      overflowCount().dataset.packedOverflowCount === "0" &&
        overflowCount().textContent === "+0",
      "Packed expansion retained a stale overflow count",
    );
    label.value = "Updated";
    items.value = [items.value[2], items.value[0], { key: "d", label: "D" }];
    await settle();
    assert(
      visible()
        .map((node) => node.dataset.packedOverflowItem)
        .join(",") === "c,a,d" &&
        visible()[1] === first &&
        first.textContent === "Updated A",
      "Packed keyed reorder or dynamic native slot content failed",
    );
    assert(
      visible()
        .map((node) => node.dataset.packedOverflowIndex)
        .join(",") === "0,1,2" && first.dataset.packedOverflowIndex === "1",
      "Packed keyed reorder retained a snapshot of the slot index",
    );
    width.value = 95;
    await settle();
    assert(
      visible().length === 1 && visible()[0].dataset.packedOverflowItem === "c",
      "Packed narrowing did not use actual item geometry",
    );
    assert(
      overflowCount().dataset.packedOverflowCount === "2" &&
        overflowCount().textContent === "+2",
      "Packed narrowing retained a stale overflow renderer scope",
    );
    const before = notifications;
    app.unmount();
    mounted = false;
    assert(host.childNodes.length === 0, "OverflowList unmount left owned DOM");
    window.dispatchEvent(new Event("resize"));
    await settle();
    assert(
      host.childNodes.length === 0 && notifications === before,
      "Unmounted OverflowList scheduled DOM or callbacks",
    );
    await checkScrollConsumer();
    return "overflowList consumer passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
  }
}

async function checkScrollConsumer() {
  const host = document.createElement("div");
  document.body.append(host);
  const width = ref(140);
  const items: OverflowItem[] = [{ key: "a" }, { key: "b" }, { key: "c" }];
  const order: string[] = [];
  const observations: Array<Record<string, unknown>> = [];
  let notifications = 0;
  const app = createVaporApp(() => (
    <OverflowList
      className="packed-scroll-overflow-list"
      itemKey="key"
      items={items}
      onIntersect={(entries) => {
        order.push("intersect");
        notifications++;
        observations.push(
          Object.fromEntries(
            Object.entries(entries).map(([key, entry]) => [
              key,
              {
                intersects: entry.isIntersecting,
                ratio: entry.intersectionRatio,
                y: entry.boundingClientRect.y,
                x: entry.boundingClientRect.x,
                width: entry.boundingClientRect.width,
                root: entry.rootBounds?.toJSON(),
              },
            ]),
          ),
        );
      }}
      onVisibleStateChange={() => order.push("visible")}
      renderMode="scroll"
      style={{ width: `${width.value}px` }}
      v-slots={{
        visibleItem: (scope) => (
          <button
            data-packed-scroll-item={String(scope.item.key)}
            style={{ width: "60px", padding: "0", border: "0" }}
          >
            {String(scope.item.key)}
          </button>
        ),
        overflowStart: (scope) => (
          <button
            data-packed-scroll-before={scope.items
              .map((item) => item.key)
              .join(",")}
            style={{ width: "20px", padding: "0", border: "0" }}
          >
            Before
          </button>
        ),
        overflowEnd: (scope) => (
          <button
            data-packed-scroll-after={scope.items
              .map((item) => item.key)
              .join(",")}
            style={{ width: "20px", padding: "0", border: "0" }}
          >
            After
          </button>
        ),
      }}
    />
  ));
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await settle();
    const wrapper = host.querySelector<HTMLElement>(
      ".semi-overflow-list-scroll-wrapper",
    )!;
    const initialClientWidth = wrapper.clientWidth;
    assert(
      initialClientWidth === 100 && wrapper.scrollWidth === 180,
      "Packed scroll wrapper actual geometry failed",
    );
    assert(
      host
        .querySelector("[data-packed-scroll-after]")
        ?.getAttribute("data-packed-scroll-after") === "b,c",
      `Packed scroll overflow renderer did not receive the end group: ${JSON.stringify(
        {
          after: host
            .querySelector("[data-packed-scroll-after]")
            ?.getAttribute("data-packed-scroll-after"),
          wrapper: wrapper.getBoundingClientRect().toJSON(),
          viewport: { width: window.innerWidth, height: window.innerHeight },
          observations,
        },
      )}`,
    );
    wrapper.scrollLeft = 80;
    await settle();
    assert(
      host
        .querySelector("[data-packed-scroll-before]")
        ?.getAttribute("data-packed-scroll-before") === "a,b" &&
        host
          .querySelector("[data-packed-scroll-after]")
          ?.getAttribute("data-packed-scroll-after") === "",
      "Packed scroll overflow renderer did not receive current start/end groups",
    );
    assert(
      order.length >= 4 &&
        order.every(
          (name, index) => name === (index % 2 ? "intersect" : "visible"),
        ),
      "Packed scroll notification ordering changed",
    );
    width.value = 240;
    await settle();
    assert(
      wrapper.clientWidth === 200 &&
        host
          .querySelector("[data-packed-scroll-before]")
          ?.getAttribute("data-packed-scroll-before") === "",
      "Packed scroll resize geometry or intersection state failed",
    );
    const before = notifications;
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0,
      "Scroll OverflowList unmount left DOM",
    );
    wrapper.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
    await settle();
    assert(
      notifications === before && host.childNodes.length === 0,
      "Detached scroll OverflowList revived callbacks or DOM",
    );
  } finally {
    if (mounted) app.unmount();
    host.remove();
  }
}
