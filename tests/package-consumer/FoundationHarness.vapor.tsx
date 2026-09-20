import { defineVaporComponent, ref } from "vue";
import { FoundationInput } from "../../website/examples/foundation/Input.vapor";
import { FoundationTooltip } from "../../website/examples/foundation/Tooltip.vapor";
import { Model } from "../fixtures/Model.vapor";
import {
  StrictFixture,
  type StrictFixtureExposed,
} from "../types/StrictFixture";

/** Validation only: compile existing examples into a private local tarball. */
export const FoundationHarness = defineVaporComponent(() => {
  const input = ref("initial-input");
  const model = ref("initial-model");
  const api = ref<StrictFixtureExposed | null>(null);
  const alive = ref(true);
  const changes = ref(0);
  const visible = ref(false);
  const exposed = ref("");
  return (
    <section>
      {alive.value && (
        <div>
          <FoundationInput
            onUpdate:value={(value) => {
              input.value = value;
              changes.value += 1;
            }}
            value={input.value}
          />
          <FoundationTooltip
            content="packed-tooltip"
            onVisibleChange={(value) => (visible.value = value)}
          />
          <Model v-model={model.value} />
          <StrictFixture
            count={2}
            label="reset-model"
            modelValue={model.value}
            onUpdate:modelValue={(value) => (model.value = value)}
            ref={api}
          />
        </div>
      )}
      <output id="input-value">{input.value}</output>
      <output id="model-value">{model.value}</output>
      <output id="changes">{changes.value}</output>
      <output id="visible">{String(visible.value)}</output>
      <output id="exposed">{exposed.value}</output>
      <button id="update" onClick={() => (input.value = "parent-update")}>
        Update parent
      </button>
      <button
        id="expose"
        onClick={() => {
          exposed.value = api.value!.focus();
          api.value!.reset();
        }}
      >
        Call exposed API
      </button>
      <button id="remove" onClick={() => (alive.value = false)}>
        Remove fixtures
      </button>
    </section>
  );
});
