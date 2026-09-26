import { createVaporApp, defineVaporComponent, nextTick, ref } from "vue";
import { Highlight } from "semi-ui-vue";
import SubpathHighlight, {
  Highlight as NamedSubpathHighlight,
  type HighlightProps,
} from "semi-ui-vue/highlight";
import "semi-ui-vue/styles/components/highlight.css";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

export async function checkHighlightConsumer() {
  assert(
    Highlight === SubpathHighlight && Highlight === NamedSubpathHighlight,
    "Highlight root and subpath identities differ",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const elementCount = () => host.children.length;
  const text = ref("Before Semi after SEMI.");
  const words = ref<HighlightProps["searchWords"]>(["Semi"]);
  const component = ref<string | undefined>(undefined);
  const mounted = ref(true);
  const app = createVaporApp(() => (
    <>
      {mounted.value && (
        <Highlight
          component={component.value}
          highlightClassName="packed-highlight"
          highlightStyle={{ color: "rgb(1, 2, 3)" }}
          searchWords={words.value}
          sourceString={text.value}
        />
      )}
    </>
  ));
  app.component(
    "project-hit",
    defineVaporComponent(() => <b>registered replacement</b>),
  );
  let attached = false;
  try {
    app.mount(host);
    attached = true;
    await nextTick();
    assert(
      host.textContent === text.value &&
        elementCount() === 2 &&
        host.querySelectorAll(
          ":scope > mark.semi-highlight-tag.packed-highlight",
        ).length === 2,
      "Packed Highlight text order, default tag or wrapper-free roots failed",
    );
    const mark = host.querySelector<HTMLElement>("mark")!;
    assert(
      mark.style.color === "rgb(1, 2, 3)" &&
        getComputedStyle(mark).fontWeight === "600",
      "Packed Highlight stylesheet or inline style failed",
    );
    words.value = [
      {
        text: "updated",
        className: "packed-word",
        style: { color: "rgb(4, 5, 6)" },
      },
    ];
    text.value = "Now Updated!";
    component.value = "em";
    await nextTick();
    assert(
      host.textContent === text.value &&
        elementCount() === 1 &&
        host.querySelector<HTMLElement>("em.packed-highlight.packed-word")
          ?.style.color === "rgb(4, 5, 6)" &&
        !host.querySelector("mark"),
      "Packed Highlight dynamic text, words, tag or per-word priority failed",
    );
    component.value = "project-hit";
    await nextTick();
    assert(
      host.textContent === text.value &&
        host.querySelector("project-hit")?.textContent === "Updated" &&
        !host.querySelector("b,em"),
      "Packed Highlight resolved a native tag through the component registry",
    );
    text.value = '<script>alert("x")</script> &amp; <b> + [x] 😀';
    words.value = [
      '<script>alert("x")</script>',
      "&amp;",
      "<b>",
      "+",
      "[x]",
      "😀",
    ];
    component.value = undefined;
    await nextTick();
    assert(
      host.textContent === text.value &&
        host.querySelectorAll("mark").length === 6 &&
        !host.querySelector("script,b,em") &&
        [...host.children].every((element) => element.childElementCount === 0),
      "Packed Highlight HTML, entities, regex punctuation or Unicode became markup",
    );
    words.value = [];
    await nextTick();
    assert(
      host.textContent === text.value && elementCount() === 0,
      "Packed Highlight empty keywords did not preserve plain source text",
    );
    mounted.value = false;
    await nextTick();
    assert(
      host.textContent === "" && !elementCount(),
      "Packed Highlight conditional removal failed",
    );
    mounted.value = true;
    words.value = ["restored"];
    text.value = "restored";
    await nextTick();
    assert(
      host.querySelector("mark")?.textContent === "restored",
      "Packed Highlight remount failed",
    );
    app.unmount();
    attached = false;
    assert(host.childNodes.length === 0, "Packed Highlight teardown left DOM");
    return "highlight consumer passed";
  } finally {
    if (attached) app.unmount();
    host.remove();
  }
}
