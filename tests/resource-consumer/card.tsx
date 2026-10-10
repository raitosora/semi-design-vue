import {
  createVaporApp,
  createComponent,
  createFor,
  defineVaporComponent,
  type ShallowRef,
  nextTick,
  onScopeDispose,
  ref,
} from "vue";
import {
  Card,
  CardGroup,
  Avatar,
  Button,
  ConfigProvider,
  provideAriaIdScope,
} from "semi-ui-vue";
import DefaultCard, { Card as NamedCard } from "semi-ui-vue/card";
import Meta, { Meta as NamedMeta } from "semi-ui-vue/card/meta";
import Group, { CardGroup as NamedGroup } from "semi-ui-vue/card/cardGroup";
import "semi-ui-vue/styles/components/card.css";
import "semi-ui-vue/styles/components/avatar.css";
import "semi-ui-vue/styles/components/button.css";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkCardConsumer() {
  assert(
    Card === DefaultCard &&
      Card === NamedCard &&
      Card.Meta === Meta &&
      Meta === NamedMeta &&
      CardGroup === Group &&
      Group === NamedGroup,
    "Card public entries differ",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const originalDir = document.body.getAttribute("dir");
  const label = ref("Packed"),
    loading = ref(false),
    alive = ref(true),
    keys = ref(["a", "b"]),
    direction = ref<"ltr" | "rtl">("ltr");
  let mounts = 0,
    disposals = 0,
    clicks = 0;
  const body = () => {
    mounts++;
    onScopeDispose(() => {
      disposals++;
    });
    return (
      <>
        <input data-card-input="" value={label.value} />
        <Card.Meta
          avatar={() => <Avatar size="small">{() => <span>A</span>}</Avatar>}
          description="Description"
          title={label.value}
        />
      </>
    );
  };
  const action = () => (
    <Button data-card-action="">{() => <span>Save</span>}</Button>
  );
  const Item = defineVaporComponent<{ id: string }>(
    (props) => (
      <Card data-card-key={props.id}>
        {() => <input aria-label={props.id} />}
      </Card>
    ),
    { props: ["id"] },
  );
  const Cards = defineVaporComponent(() =>
    createFor(
      () => keys.value,
      (key: ShallowRef<string>) =>
        createComponent(Item, { id: () => key.value }),
      (key) => key,
    ),
  );
  const app = createVaporApp(
    defineVaporComponent(() => {
      provideAriaIdScope("packed-card-consumer");
      return (
        <ConfigProvider direction={direction.value}>
          {() => (
            <section>
              {alive.value && (
                <Card
                  actions={[action, 0]}
                  children={body}
                  className="packed-card"
                  data-card="ready"
                  footer="Footer"
                  footerLine
                  loading={loading.value}
                  onClick={() => {
                    clicks++;
                  }}
                  shadows="hover"
                  title={label.value}
                />
              )}
              <CardGroup data-card-group="" spacing={[8, 16]}>
                {() => <Cards />}
              </CardGroup>
              <Card
                children="<img src=x>"
                className="card-escaped"
                title="<b>safe</b>"
              />
              <Card
                actions={[]}
                children={0}
                className="card-zero"
                cover={0}
                footer={0}
                title={0}
              />
              <Card className="card-empty-slots">
                {{
                  title: () => <></>,
                  default: () => <></>,
                  footer: () => <></>,
                }}
              </Card>
            </section>
          )}
        </ConfigProvider>
      );
    }),
  );
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    const root = host.querySelector<HTMLElement>(".packed-card")!;
    const input = root.querySelector<HTMLInputElement>("[data-card-input]")!;
    const button = root.querySelector<HTMLButtonElement>("[data-card-action]")!;
    assert(
      root.dataset.card === "ready" &&
        root.getAttribute("aria-busy") === "false" &&
        root.classList.contains("semi-card-bordered"),
      "Card attrs/defaults failed",
    );
    assert(
      root.querySelector("h6")?.textContent === "Packed" &&
        root.querySelector(".semi-card-meta-wrapper-title")?.textContent ===
          "Packed",
      "Card title/Meta composition failed",
    );
    assert(
      getComputedStyle(root).borderTopWidth === "1px" &&
        getComputedStyle(root.querySelector(".semi-card-body")!).paddingTop ===
          "20px",
      "Card packed stylesheet failed",
    );
    assert(
      root.querySelectorAll(".semi-card-body-actions-item").length === 2 &&
        root.querySelector('[x-semi-prop="actions.1"]')?.textContent === "0",
      "Card actions array failed",
    );
    assert(
      !host.querySelector(".card-escaped b, .card-escaped img") &&
        host
          .querySelector(".card-escaped")
          ?.textContent?.includes("<img src=x>"),
      "Card content escaping failed",
    );
    assert(
      !host.querySelector(
        ".card-zero .semi-card-header, .card-zero .semi-card-cover, .card-zero .semi-card-footer",
      ) &&
        host.querySelector(".card-zero .semi-card-body")?.textContent === "0",
      "Card zero truthiness failed",
    );
    assert(
      host.querySelector(".card-empty-slots .semi-card-header") &&
        host.querySelector(".card-empty-slots .semi-card-footer"),
      "Card declared empty slots lost structural presence",
    );
    input.focus();
    button.click();
    label.value = "Updated";
    direction.value = "rtl";
    await nextTick();
    assert(
      root.querySelector("[data-card-input]") === input &&
        input.value === "Updated" &&
        document.activeElement === input &&
        mounts === 1 &&
        disposals === 0 &&
        clicks === 1,
      "Card renderer DOM/focus/lifecycle/bubbling failed",
    );
    assert(
      root.closest(".semi-rtl") && getComputedStyle(root).direction === "rtl",
      "Card context/RTL failed",
    );
    const retained = host.querySelector<HTMLElement>('[data-card-key="a"]')!;
    const retainedInput = retained.querySelector("input")!;
    retainedInput.focus();
    keys.value = ["b", "c", "a"];
    await nextTick();
    assert(
      host.querySelector('[data-card-key="a"]') === retained &&
        [...host.querySelectorAll("[data-card-key]")]
          .map((node) => node.getAttribute("data-card-key"))
          .join() === "b,c,a",
      "CardGroup stable reorder failed",
    );
    loading.value = true;
    await nextTick();
    assert(
      root.getAttribute("aria-busy") === "true" &&
        !root.querySelector("[data-card-input]") &&
        root.querySelector(".semi-skeleton-title") &&
        Number(disposals) === 1 &&
        root.querySelector("[data-card-action]") === button,
      "Card loading ownership/Skeleton/actions failed",
    );
    label.value = "Reloaded";
    loading.value = false;
    await nextTick();
    assert(
      root.querySelector<HTMLInputElement>("[data-card-input]")?.value ===
        "Reloaded" &&
        Number(mounts) === 2 &&
        root.querySelector("[data-card-input]") !== input,
      "Card loading remount failed",
    );
    alive.value = false;
    await nextTick();
    assert(
      !host.querySelector(".packed-card") && Number(disposals) === 2,
      "Card removal retained scope",
    );
    alive.value = true;
    await nextTick();
    assert(Number(mounts) === 3, "Card reattachment failed");
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0 && Number(disposals) === 3,
      "Card teardown retained DOM/scope",
    );
    label.value = "Disposed";
    keys.value = [];
    await nextTick();
    assert(
      host.childNodes.length === 0 && Number(mounts) === 3,
      "Card detached update revived content",
    );
    return "card consumer passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
    if (originalDir === null) document.body.removeAttribute("dir");
    else document.body.setAttribute("dir", originalDir);
  }
}
