import { createVaporApp, nextTick, onScopeDispose, ref } from "vue";
import { Input, TextArea, InputGroup, ConfigProvider } from "semi-ui-vue";
import DefaultInput, { Input as NamedInput } from "semi-ui-vue/input";
import DirectTextArea from "semi-ui-vue/input/textarea";
import DirectInputGroup from "semi-ui-vue/input/inputGroup";
import "semi-ui-vue/styles/components/input.css";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkInputConsumer() {
  assert(
    Input === DefaultInput &&
      Input === NamedInput &&
      TextArea === DirectTextArea &&
      InputGroup === DirectInputGroup,
    "Input public identities differ",
  );
  assert(
    !("Group" in Input) && !("TextArea" in Input),
    "Invented Input static API",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const originalDir = document.body.getAttribute("dir");
  const value = ref("Packed"),
    text = ref("First\nSecond"),
    alive = ref(true);
  const label = ref("Owned"),
    direction = ref<"ltr" | "rtl">("ltr");
  const disabled = ref(false);
  const inputRef = ref<HTMLInputElement | null>(null);
  const textareaRef = ref<HTMLTextAreaElement | null>(null);
  let calls: readonly string[] = [];
  let mounts = 0,
    disposals = 0,
    bubbled = 0;
  const prefix = () => {
    mounts++;
    onScopeDispose(() => {
      disposals++;
    });
    return (
      <button data-input-owned="" type="button">
        {label.value}
      </button>
    );
  };
  const app = createVaporApp(() => (
    <ConfigProvider direction={direction.value}>
      {() => (
        <section
          onMousedown={() => {
            bubbled++;
          }}
        >
          {alive.value && (
            <InputGroup
              disabled={disabled.value}
              label={{
                text: "Packed label",
                name: "packed-group",
                required: true,
                optional: true,
              }}
              size="large"
            >
              {() => (
                <>
                  <Input
                    composition
                    forwardRef={inputRef}
                    id="packed-input"
                    onChange={(next, event) => {
                      calls = [...calls, `change:${next}:${event.type}`];
                    }}
                    onClear={(event) => {
                      calls = [...calls, `clear:${event.type}`];
                    }}
                    onCompositionEnd={() => {
                      calls = [...calls, "end"];
                    }}
                    onCompositionStart={() => {
                      calls = [...calls, "start"];
                    }}
                    onUpdate:value={(next) => {
                      calls = [...calls, `model:${next}`];
                      value.value = String(next);
                    }}
                    showClear
                    value={value.value}
                  >
                    {{ prefix }}
                  </Input>
                  <Input
                    defaultValue={0}
                    disabled={false}
                    id="packed-enabled"
                  />
                </>
              )}
            </InputGroup>
          )}
          <TextArea
            autosize={{ minRows: 2, maxRows: 5 }}
            forwardRef={textareaRef}
            id="packed-textarea"
            lineNumberStart={3}
            maxCount={2}
            onUpdate:value={(next) => {
              text.value = next;
            }}
            showCounter
            showLineNumber
            value={text.value}
          />
          <Input defaultValue="secret" id="packed-password" mode="password" />
          <Input
            defaultValue="<script>unsafe</script>"
            id="packed-escaped"
            validateStatus="error"
          />
        </section>
      )}
    </ConfigProvider>
  ));
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    const input = host.querySelector<HTMLInputElement>("#packed-input")!;
    const area = host.querySelector<HTMLTextAreaElement>("#packed-textarea")!;
    assert(
      inputRef.value === input && textareaRef.value === area,
      "Input native forwardRef differs",
    );
    assert(
      input.value === "Packed" && area.value === "First\nSecond",
      "Input initial values differ",
    );
    assert(
      host.querySelector("label")?.htmlFor === "packed-group",
      "Group label association differs",
    );
    assert(
      input.classList.contains("semi-input-large"),
      "Group size did not reach Input",
    );
    assert(
      host.querySelector<HTMLInputElement>("#packed-enabled")!.value === "0",
      "Input default zero lost",
    );
    assert(
      host.querySelector<HTMLInputElement>("#packed-escaped")!.value ===
        "<script>unsafe</script>" &&
        !host.querySelector("script") &&
        host.querySelector("#packed-escaped")!.getAttribute("aria-invalid") ===
          "true",
      "Input native escaping/error ARIA differs",
    );
    const owned = host.querySelector<HTMLButtonElement>("[data-input-owned]")!;
    owned.focus();
    label.value = "Updated";
    direction.value = "rtl";
    await nextTick();
    assert(
      host.querySelector("[data-input-owned]") === owned &&
        owned.textContent === "Updated" &&
        document.activeElement === owned &&
        mounts === 1 &&
        disposals === 0,
      "Input prefix ownership update replaced DOM",
    );
    input.focus();
    input.setSelectionRange(1, 3);
    label.value = "Again";
    await nextTick();
    assert(
      input.selectionStart === 1 &&
        input.selectionEnd === 3 &&
        document.activeElement === input,
      "Unrelated Input content update reset native selection",
    );
    assert(input.closest(".semi-rtl"), "Input direction context absent");
    calls = [];
    input.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true, data: "中" }),
    );
    input.value = "中";
    input.dispatchEvent(
      new InputEvent("input", { bubbles: true, data: "中", isComposing: true }),
    );
    await nextTick();
    assert(
      calls.join() === "start" && input.value === "中",
      "Input composition emitted early change",
    );
    input.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true, data: "中" }),
    );
    await nextTick();
    assert(
      calls.join() === "start,end,model:中,change:中:compositionend" &&
        value.value === "中",
      "Input composition notification order differs",
    );
    calls = [];
    bubbled = 0;
    const clear = input
      .closest(".semi-input-wrapper")!
      .querySelector<HTMLElement>(".semi-input-clearbtn")!;
    assert(clear, "Input clear button absent while focused");
    const clearEvent = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
    });
    clear.dispatchEvent(clearEvent);
    await nextTick();
    assert(
      calls.join() === "model:,change::mousedown,clear:mousedown" &&
        // The native handler mutates value outside TypeScript control flow.
        (input.value as string) === "" &&
        bubbled === 0 &&
        !clearEvent.defaultPrevented &&
        (clearEvent as MouseEvent & { __fromClearBtn?: boolean })
          .__fromClearBtn === true,
      "Input clear value/event/propagation order differs",
    );
    disabled.value = true;
    await nextTick();
    assert(
      input.disabled &&
        !host.querySelector<HTMLInputElement>("#packed-enabled")!.disabled,
      "Group disabled explicit child precedence differs",
    );
    const password = host.querySelector<HTMLInputElement>("#packed-password")!;
    const eye = password
      .closest(".semi-input-wrapper")!
      .querySelector<HTMLElement>('[role="button"]')!;
    assert(
      password.type === "password" && eye,
      "Password initial state differs",
    );
    eye.click();
    await nextTick();
    assert(
      String(password.type) === "text" && document.activeElement === password,
      "Password visibility/focus behavior differs",
    );
    assert(
      area.style.resize === "none" &&
        area.closest(".semi-input-textarea-wrapper") &&
        host.querySelector(".semi-input-textarea-counter"),
      "TextArea autosize/counter structure absent",
    );
    area.value = "Long text is not truncated by maxCount";
    area.dispatchEvent(
      new InputEvent("input", { bubbles: true, data: "text" }),
    );
    await nextTick();
    assert(
      text.value === "Long text is not truncated by maxCount" &&
        area.value === text.value,
      "TextArea maxCount incorrectly truncated native input",
    );
    alive.value = false;
    await nextTick();
    assert(
      inputRef.value === null &&
        Number(disposals) === 1 &&
        !host.querySelector("#packed-input"),
      "Input removal retained native ref/owned scope",
    );
    alive.value = true;
    await nextTick();
    assert(
      inputRef.value !== input && Number(mounts) === 2,
      "Input remount reused stale node",
    );
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0 &&
        inputRef.value === null &&
        textareaRef.value === null &&
        Number(disposals) === 2,
      "Input teardown retained DOM/ref/owned scope",
    );
    label.value = "Disposed";
    text.value = "Disposed";
    await nextTick();
    assert(host.childNodes.length === 0, "Input disposed update revived DOM");
    return "input consumer passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
    if (originalDir === null) document.body.removeAttribute("dir");
    else document.body.setAttribute("dir", originalDir);
  }
}
