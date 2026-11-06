import { defineVaporComponent, ref } from "vue";
import { Input, InputGroup, TextArea } from "semi-ui-vue";

export const InputHarness = defineVaporComponent(() => {
  const value = ref("packed");
  const text = ref("first\nsecond");
  const events = ref<string[]>([]);
  const native = ref<HTMLInputElement | null>(null);
  const area = ref<HTMLTextAreaElement | null>(null);
  const append = (event: string) => {
    events.value = [...events.value, event];
  };
  return (
    <section
      data-foundation-public-input=""
      style={{ display: "grid", gap: "12px" }}
    >
      <InputGroup
        label={{
          text: "Packed controls",
          name: "packed-group",
          required: true,
        }}
        size="large"
      >
        {() => (
          <>
            <Input
              aria-label="Packed public input"
              composition
              forwardRef={native}
              mode="password"
              onChange={(next) => append(`change:${next}`)}
              onClear={() => append("clear")}
              onCompositionEnd={() => append("end")}
              onCompositionStart={() => append("start")}
              onUpdate:value={(next) => {
                append(`model:${next}`);
                value.value = next;
              }}
              prefix="<label>"
              showClear
              value={value.value}
            />
          </>
        )}
      </InputGroup>
      <TextArea
        aria-label="Packed public textarea"
        autosize={{ minRows: 2, maxRows: 5 }}
        forwardRef={area}
        maxCount={3}
        onUpdate:value={(next) => {
          text.value = next;
        }}
        showCounter
        showLineNumber
        value={text.value}
      />
      <button
        id="packed-input-select"
        onClick={() => {
          native.value?.focus();
          native.value?.setSelectionRange(1, 3);
        }}
      >
        Select native input
      </button>
      <button
        id="packed-input-program"
        onClick={() => {
          value.value = "updated";
          text.value = "one\ntwo\nthree\nfour";
        }}
      >
        Update input values
      </button>
      <button
        id="packed-input-reset-events"
        onClick={() => {
          events.value = [];
        }}
      >
        Reset events
      </button>
      <output id="packed-input-events">{events.value.join("|")}</output>
    </section>
  );
});
