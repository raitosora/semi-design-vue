import { provideAriaIdScope } from "semi-ui-vue";
import {
  createApp,
  h,
  nextTick,
  onScopeDispose,
  ref,
  vaporInteropPlugin,
  watchEffect,
} from "vue";
import Card from "semi-ui-vue/card";
import CardGroup from "semi-ui-vue/card/cardGroup";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkCardInterop() {
  const host = document.createElement("div");
  document.body.append(host);
  const label = ref("Interop"),
    loading = ref(false),
    alive = ref(true);
  let mounts = 0,
    disposals = 0;
  const body = () => {
    mounts++;
    const input = document.createElement("input");
    input.dataset.cardInterop = "";
    watchEffect(() => {
      input.value = label.value;
    });
    onScopeDispose(() => {
      disposals++;
    });
    return input;
  };
  const app = createApp({
    setup: () => {
      provideAriaIdScope("packed-card-interop");
      return () =>
        h(CardGroup, null, {
          default: () =>
            alive.value
              ? h(
                  Card,
                  {
                    title: label.value,
                    loading: loading.value,
                    children: body,
                  },
                  {
                    footer: () =>
                      h(
                        "button",
                        { "data-card-interop-footer": "" },
                        label.value,
                      ),
                  },
                )
              : null,
        });
    },
  }).use(vaporInteropPlugin);
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    const input = host.querySelector<HTMLInputElement>("[data-card-interop]")!;
    const button = host.querySelector<HTMLButtonElement>(
      "[data-card-interop-footer]",
    )!;
    input.focus();
    label.value = "Updated";
    await nextTick();
    assert(
      host.querySelector("[data-card-interop]") === input &&
        input.value === "Updated" &&
        document.activeElement === input &&
        mounts === 1 &&
        disposals === 0,
      "Card interop native renderer ownership failed",
    );
    button.focus();
    loading.value = true;
    await nextTick();
    assert(
      !host.querySelector("[data-card-interop]") &&
        host.querySelector(".semi-skeleton-title") &&
        Number(disposals) === 1 &&
        document.activeElement === button,
      "Card interop loading replaced footer or retained body",
    );
    label.value = "Reloaded";
    loading.value = false;
    await nextTick();
    assert(
      host.querySelector<HTMLInputElement>("[data-card-interop]")?.value ===
        "Reloaded" &&
        Number(mounts) === 2 &&
        host.querySelector("[data-card-interop-footer]") === button &&
        button.textContent === "Reloaded",
      "Card interop remount/slot identity failed",
    );
    alive.value = false;
    await nextTick();
    assert(
      Number(disposals) === 2 && !host.querySelector(".semi-card"),
      "Card interop removal retained scope",
    );
    app.unmount();
    mounted = false;
    assert(host.childNodes.length === 0, "Card interop teardown retained DOM");
    label.value = "Disposed";
    await nextTick();
    assert(
      host.childNodes.length === 0 && String(input.value) === "Updated",
      "Card interop detached effects still run",
    );
    return "card interop passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
  }
}
