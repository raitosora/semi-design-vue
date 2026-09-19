import { createVaporApp, defineVaporComponent, nextTick, ref } from "vue";
import {
  createDomRef,
  createDomScheduler,
  createRovingTabindex,
  focusElement,
  getScrollParents,
  observeMediaQuery,
  observeOutsidePointer,
  observeResize,
  provideAriaIdScope,
  useAriaId,
} from "semi-ui-vue";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

export async function checkDomConsumer() {
  const resizeCalls: ResizeObserverEntry[][] = [];
  const outsideCalls: string[] = [];
  const mediaCalls: boolean[] = [];
  const width = ref(180);
  const enabled = ref(true);
  const ids: string[] = [];

  const Field = defineVaporComponent<{ prefix: string }>(
    (props) => {
      const id = useAriaId("field");
      ids.push(id);
      return (
        <>
          <label for={id}>{props.prefix}</label>
          <input data-dom-input id={id} />
        </>
      );
    },
    { props: ["prefix"] },
  );

  const Probe = defineVaporComponent<{ prefix: string }>(
    (props) => {
      const firstRoot = ref<HTMLElement | null>(null);
      const secondRoot = ref<HTMLElement | null>(null);
      const measured = createDomRef<HTMLDivElement>();
      provideAriaIdScope(props.prefix);
      observeResize(
        () => (measured.element.value ? [measured.element.value] : []),
        (entries) => {
          resizeCalls.push([...entries]);
        },
      );
      observeOutsidePointer(
        () =>
          [firstRoot.value, secondRoot.value].filter(Boolean) as HTMLElement[],
        () => outsideCalls.push(props.prefix),
        () => enabled.value,
      );
      observeMediaQuery(
        () => "(min-width: 0px)",
        (matches) => mediaCalls.push(matches),
      );
      return (
        <section data-dom-root={props.prefix}>
          <div
            data-dom-measured
            ref={(element) => {
              const node = element as HTMLDivElement | null;
              measured.set(node);
              firstRoot.value = node;
            }}
            style={{ width: `${width.value}px`, height: "48px" }}
          />
          <div data-dom-second ref={secondRoot} />
          <button data-roving tabindex={0}>
            one
          </button>
          <button data-roving tabindex={-1}>
            two
          </button>
          <Field prefix={props.prefix} />
        </section>
      );
    },
    { props: ["prefix"] },
  );

  const hostA = document.createElement("div");
  const hostB = document.createElement("div");
  document.body.append(hostA, hostB);
  const appA = createVaporApp(() => <Probe prefix="consumer-a" />);
  const appB = createVaporApp(() => <Probe prefix="consumer-b" />);
  let mountedA = false;
  let mountedB = false;
  try {
    appA.mount(hostA);
    mountedA = true;
    appB.mount(hostB);
    mountedB = true;
    await nextTick();
    assert(
      ids.length === 2 && ids[0] !== ids[1],
      "ARIA IDs were not isolated between apps",
    );
    assert(
      hostA.querySelector("label")?.htmlFor ===
        hostA.querySelector("input")?.id &&
        hostA.querySelector("label")?.htmlFor === ids[0],
      "ARIA ID did not reach the rendered label",
    );
    assert(
      hostA.querySelector("[data-dom-measured]")?.isConnected,
      "DOM ref did not retain its mounted element",
    );

    const scrollBox = document.createElement("div");
    scrollBox.style.cssText = "overflow: auto; width: 20px; height: 10px";
    const scrollContent = document.createElement("div");
    scrollContent.style.cssText = "width: 40px; height: 30px";
    const scrollTarget = document.createElement("button");
    scrollContent.append(scrollTarget);
    scrollBox.append(scrollContent);
    hostA.append(scrollBox);
    assert(
      getScrollParents(scrollTarget).includes(scrollBox),
      "scroll parent discovery missed the actual scrolling ancestor",
    );
    assert(
      focusElement(scrollTarget),
      "focus helper could not focus a connected target",
    );
    scrollTarget.setAttribute("aria-disabled", "true");
    assert(
      !focusElement(scrollTarget),
      "focus helper focused an aria-disabled target",
    );
    scrollTarget.removeAttribute("aria-disabled");

    const outside = document.createElement("button");
    document.body.append(outside);
    hostA
      .querySelector("[data-dom-measured]")!
      .dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, composed: true }),
      );
    assert(
      outsideCalls.join(",") === "consumer-b",
      "inside app A must be outside only for app B",
    );
    outside.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true }),
    );
    assert(
      Number(outsideCalls.length) === 3 &&
        outsideCalls.includes("consumer-a") &&
        outsideCalls.includes("consumer-b"),
      "outside pointer did not observe both app roots",
    );
    enabled.value = false;
    await nextTick();
    outside.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true }),
    );
    assert(
      Number(outsideCalls.length) === 3,
      "outside pointer ignored live disabled state",
    );

    const measuredElement = hostA.querySelector<HTMLElement>(
      "[data-dom-measured]",
    )!;
    assert(
      measuredElement.getBoundingClientRect().width === 180,
      "Resize fixture did not render its initial 180px geometry",
    );
    measuredElement.style.width = "220px";
    await new Promise<void>((resolve, reject) => {
      const deadline = performance.now() + 2000;
      const poll = () => {
        const observed = resizeCalls.some((entries) =>
          entries.some(
            (entry) =>
              entry.target === measuredElement &&
              entry.contentRect.width === 220,
          ),
        );
        if (observed) {
          resolve();
          return;
        }
        if (performance.now() >= deadline) {
          reject(
            new Error("ResizeObserver did not report actual 220px geometry"),
          );
          return;
        }
        requestAnimationFrame(poll);
      };
      requestAnimationFrame(poll);
    });
    assert(
      resizeCalls.some((entries) =>
        entries.some(
          (entry) =>
            entry.target === measuredElement && entry.contentRect.width === 220,
        ),
      ),
      "ResizeObserver did not report actual geometry",
    );

    const scheduler = createDomScheduler(() => window);
    let frameRan = false;
    scheduler.frame((time) => {
      frameRan = time >= 0;
    });
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    const debounced: string[] = [];
    const trailing = scheduler.debounce(
      (value: string) => debounced.push(value),
      1000,
    );
    trailing.schedule("first");
    trailing.schedule("last");
    trailing.flush();
    scheduler.dispose();
    assert(
      debounced.join(",") === "last" && frameRan,
      "DOM scheduler did not flush frame/debounce work",
    );
    assert(
      mediaCalls.length > 0,
      "media query observer did not perform its initial read",
    );

    const items = [...hostA.querySelectorAll<HTMLElement>("[data-roving]")];
    const roving = createRovingTabindex(() => items, {
      orientation: () => "horizontal",
    });
    roving.refresh();
    assert(
      items.length === 2,
      "roving fixture did not render exactly two items",
    );
    const onKeydown = (event: KeyboardEvent) => roving.onKeydown(event);
    items[0].addEventListener("keydown", onKeydown);
    try {
      items[0].focus();
      items[1].setAttribute("disabled", "true");
      roving.refresh();
      items[0].dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          bubbles: true,
          cancelable: true,
        }),
      );
      assert(
        document.activeElement === items[0],
        "roving tabindex moved to a disabled item",
      );
      items[1].removeAttribute("disabled");
      roving.refresh();
      items[0].dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          bubbles: true,
          cancelable: true,
        }),
      );
      assert(
        document.activeElement === items[1],
        "roving tabindex did not follow a dynamically enabled item",
      );
    } finally {
      items[0].removeEventListener("keydown", onKeydown);
      roving.dispose();
    }
    enabled.value = true;
    await nextTick();
    outside.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true }),
    );
    assert(
      Number(outsideCalls.length) === 5,
      "outside pointer did not react after live enablement was restored",
    );
    const outsideBeforeUnmount = outsideCalls.length;
    appA.unmount();
    mountedA = false;
    appB.unmount();
    mountedB = false;
    outside.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true }),
    );
    assert(
      Number(outsideCalls.length) === outsideBeforeUnmount,
      "DOM observers remained active after Vapor app unmount",
    );
    outside.remove();
    return "dom consumer passed";
  } finally {
    if (mountedA) appA.unmount();
    if (mountedB) appB.unmount();
    hostA.remove();
    hostB.remove();
  }
}

function checkInvalidDomRefType() {
  const invalidDomRef = createDomRef<HTMLDivElement>();
  // @ts-expect-error DOM refs accept only their declared element type.
  invalidDomRef.set(document.createElement("span"));
}
void checkInvalidDomRefType;
