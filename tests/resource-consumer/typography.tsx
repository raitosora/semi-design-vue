import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  onScopeDispose,
  ref,
} from "vue";
import { Typography, ConfigProvider, provideAriaIdScope } from "semi-ui-vue";
import DefaultTypography, {
  Typography as NamedTypography,
} from "semi-ui-vue/typography";
import Text from "semi-ui-vue/typography/text";
import Title from "semi-ui-vue/typography/title";
import Paragraph from "semi-ui-vue/typography/paragraph";
import Numeral from "semi-ui-vue/typography/numeral";
import "semi-ui-vue/styles/components/typography.css";
import "semi-ui-vue/styles/components/icons.css";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkTypographyConsumer() {
  assert(
    Typography === DefaultTypography && Typography === NamedTypography,
    "Typography entry identity differs",
  );
  assert(
    Typography.Text === Text &&
      Typography.Title === Title &&
      Typography.Paragraph === Paragraph &&
      Typography.Numeral === Numeral,
    "Typography static/subpath identities differ",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const originalDir = document.body.getAttribute("dir");
  const label = ref("Packed"),
    alive = ref(true),
    direction = ref<"ltr" | "rtl">("ltr"),
    value = ref(1234.5);
  const element = ref<HTMLElement | null>(null);
  let mounts = 0,
    disposals = 0,
    clicks = 0;
  const copies: Array<{ content: string; result: boolean }> = [];
  const expansions: boolean[] = [];
  const native = () => {
    mounts++;
    onScopeDispose(() => {
      disposals++;
    });
    return <input data-packed-typography-input="" value={label.value} />;
  };
  const app = createVaporApp(
    defineVaporComponent(() => {
      provideAriaIdScope("packed-typography-consumer");
      return (
        <ConfigProvider direction={direction.value}>
          {() => (
            <section
              onClick={() => {
                clicks++;
              }}
            >
              <Typography
                className="packed-typography-root"
                component="article"
                forwardRef={element}
              >
                {() => <span>{label.value}</span>}
              </Typography>
              {alive.value && (
                <Text children={native} className="packed-typography-native" />
              )}
              <Title
                children={label.value}
                className="packed-typography-title"
                heading={3}
              />
              <Paragraph
                className="packed-typography-paragraph"
                spacing="extended"
              >
                {() => (
                  <>
                    <button data-packed-typography-button="">
                      {label.value}
                    </button>
                    <span>second</span>
                  </>
                )}
              </Paragraph>
              <Paragraph
                children="A long packed paragraph must overflow its narrow measured container"
                className="packed-typography-ellipsis"
                ellipsis={{
                  rows: 1,
                  expandable: true,
                  collapsible: true,
                  expandText: "Open",
                  collapseText: "Close",
                  onExpand: (expanded) => expansions.push(expanded),
                }}
                style={{ width: "120px", fontFamily: "monospace" }}
              />
              <Text
                children="Visible copy"
                className="packed-typography-copy"
                copyable={{
                  content: "Packed copy",
                  successTip: "Copied",
                  render: (copied, doCopy) => (
                    <button
                      data-packed-typography-copy=""
                      onClick={(event: unknown) => {
                        if (event instanceof MouseEvent) doCopy(event);
                      }}
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  ),
                  onCopy: (_event, content, result) =>
                    copies.push({ content, result }),
                }}
              />
              <Text
                children="Default copy"
                className="packed-typography-default-copy"
                copyable
              />
              <Text children="<b>safe</b>" className="packed-typography-safe" />
              <Text children={0} className="packed-typography-zero" />
              <Text
                children="Link"
                className="packed-typography-link"
                link={{ href: "#packed-typography" }}
              />
              <Numeral
                className="packed-typography-numeral"
                precision={2}
                rule="numbers"
              >
                {(scope) => (
                  <strong data-packed-typography-formatted="">
                    {scope.format(value.value)}
                  </strong>
                )}
              </Numeral>
              <Numeral
                children={value.value}
                className="packed-typography-value"
                precision={2}
                rule="numbers"
              />
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
    const input = host.querySelector<HTMLInputElement>(
      "[data-packed-typography-input]",
    )!;
    const button = host.querySelector<HTMLButtonElement>(
      "[data-packed-typography-button]",
    )!;
    const root = host.querySelector(".packed-typography-root");
    const formatted = host.querySelector("[data-packed-typography-formatted]");
    assert(
      root?.tagName === "ARTICLE" && element.value === root,
      "Typography semantic root/ref failed",
    );
    assert(
      host.querySelector(".packed-typography-title")?.tagName === "H3",
      "Typography title heading failed",
    );
    assert(
      host.querySelector(".packed-typography-safe")?.textContent ===
        "<b>safe</b>" && !host.querySelector(".packed-typography-safe b"),
      "Typography text escaping failed",
    );
    assert(
      host.querySelector(".packed-typography-zero")?.textContent === "0",
      "Typography numeric zero was lost",
    );
    assert(
      host.querySelector(".packed-typography-link a")?.getAttribute("href") ===
        "#packed-typography",
      "Typography link semantics failed",
    );
    assert(
      host.querySelector(".packed-typography-value")?.textContent === "1234.50",
      "Numeral number formatting failed",
    );
    assert(
      formatted?.textContent === "1234.50",
      "Numeral scoped formatter failed",
    );
    const defaultCopySvg = host.querySelector<SVGElement>(
      ".packed-typography-default-copy .semi-typography-action-copy-icon svg",
    );
    const defaultCopySize = defaultCopySvg?.getBoundingClientRect();
    assert(
      defaultCopySize?.width === 16 && defaultCopySize.height === 16,
      `Typography default copy icon lost inherited 16px geometry: ${JSON.stringify(
        {
          found: Boolean(defaultCopySvg),
          rect: defaultCopySize?.toJSON(),
          svg: defaultCopySvg?.outerHTML,
          ancestors: defaultCopySvg
            ? [
                defaultCopySvg,
                defaultCopySvg.parentElement,
                defaultCopySvg.parentElement?.parentElement,
              ]
                .filter((node): node is SVGElement | HTMLElement =>
                  Boolean(node),
                )
                .map((node) => ({
                  class: node.getAttribute("class"),
                  fontSize: getComputedStyle(node).fontSize,
                  display: getComputedStyle(node).display,
                  transform: getComputedStyle(node).transform,
                  visibility: getComputedStyle(node).visibility,
                }))
            : [],
        },
      )}`,
    );
    input.focus();
    label.value = "Updated";
    direction.value = "rtl";
    value.value = -12.5;
    await nextTick();
    assert(
      host.querySelector("[data-packed-typography-input]") === input &&
        input.value === "Updated" &&
        document.activeElement === input &&
        mounts === 1 &&
        disposals === 0,
      "Typography renderer update lost DOM/focus/scope",
    );
    assert(
      host.querySelector("[data-packed-typography-button]") === button &&
        button.textContent === "Updated",
      "Typography fragment slot update replaced content",
    );
    assert(
      host.querySelector(".packed-typography-title")?.textContent ===
        "Updated" &&
        host.querySelector(".packed-typography-value")?.textContent ===
          "-12.50",
      "Typography text/number dynamic update failed",
    );
    assert(
      host.querySelector("[data-packed-typography-formatted]") === formatted &&
        String(formatted?.textContent) === "-12.50" &&
        root?.closest("[dir]")?.getAttribute("dir") === "rtl",
      "Typography scoped format/context update lost ownership",
    );
    button.click();
    assert(clicks === 1, "Typography changed native bubbling");
    // This is a deterministic execCommand replacement, not Clipboard permission evidence.
    const execCommand = Object.getOwnPropertyDescriptor(
      document,
      "execCommand",
    );
    const readonlyBefore = [...document.querySelectorAll("textarea[readonly]")];
    let selectedCopy = "";
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: (command: string) => {
        assert(
          command === "copy",
          "Typography requested another editing command",
        );
        const textarea = document.activeElement;
        assert(
          textarea instanceof HTMLTextAreaElement,
          "Typography copy did not select a textarea",
        );
        selectedCopy = textarea.value;
        return true;
      },
    });
    try {
      host
        .querySelector<HTMLButtonElement>("[data-packed-typography-copy]")!
        .click();
    } finally {
      if (execCommand)
        Object.defineProperty(document, "execCommand", execCommand);
      else Reflect.deleteProperty(document, "execCommand");
    }
    await nextTick();
    assert(
      selectedCopy === "Packed copy" &&
        copies.length === 1 &&
        copies[0].content === "Packed copy" &&
        copies[0].result &&
        host.querySelector("[data-packed-typography-copy]")?.textContent ===
          "Copied" &&
        [...document.querySelectorAll("textarea[readonly]")].every(
          (node, index) => node === readonlyBefore[index],
        ) &&
        document.querySelectorAll("textarea[readonly]").length ===
          readonlyBefore.length,
      "Packed Typography copy content/result/feedback/cleanup failed",
    );
    let expansion: HTMLAnchorElement | null = null;
    for (let frame = 0; frame < 40 && !expansion; frame++) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      expansion = host.querySelector<HTMLAnchorElement>(
        ".packed-typography-ellipsis .semi-typography-ellipsis-expand",
      );
    }
    assert(
      expansion?.textContent === "Open",
      "Packed Typography first overflow was not measured",
    );
    expansion.click();
    await nextTick();
    assert(
      expansions.join(",") === "true" &&
        String(expansion.textContent) === "Close" &&
        host
          .querySelector(".packed-typography-ellipsis")
          ?.textContent?.includes("must overflow"),
      "Packed Typography expand failed",
    );
    expansion.click();
    await nextTick();
    assert(
      expansions.join(",") === "true,false" &&
        String(expansion.textContent) === "Open",
      "Packed Typography collapse failed",
    );
    alive.value = false;
    await nextTick();
    assert(
      Number(disposals) === 1 &&
        !host.querySelector("[data-packed-typography-input]"),
      "Typography branch did not dispose renderer",
    );
    alive.value = true;
    await nextTick();
    assert(Number(mounts) === 2, "Typography renderer remount failed");
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0 &&
        Number(disposals) === 2 &&
        element.value === null,
      "Typography unmount retained DOM/ref/scope",
    );
    label.value = "Disposed";
    await nextTick();
    assert(host.childNodes.length === 0, "Typography revived after unmount");
    return "typography consumer passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
    if (originalDir === null) document.body.removeAttribute("dir");
    else document.body.setAttribute("dir", originalDir);
  }
}
