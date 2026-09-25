import { defineVaporComponent, ref } from "vue";
import { Col, Layout, Row, Space } from "semi-ui-vue";
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
          <Space
            align="baseline"
            aria-label="Foundation actions"
            className="foundation-space"
            role="group"
            spacing={[8, "medium"]}
            wrap
          >
            {() => (
              <>
                <button type="button">First action</button>
                <button type="button">Second action</button>
              </>
            )}
          </Space>
          <Row data-foundation-grid="" gutter={8}>
            {() => (
              <>
                <Col span={12}>{() => <span>Grid A</span>}</Col>
                <Col span={12}>{() => <span>Grid B</span>}</Col>
              </>
            )}
          </Row>
          <Layout
            className="foundation-layout"
            data-foundation-layout=""
            style={{ width: "240px", height: "80px" }}
            v-slots={{
              default: () => (
                <>
                  <Layout.Sider
                    style={{ width: "60px", flex: "0 0 60px" }}
                    v-slots={{ default: () => <span>Navigation</span> }}
                  />
                  <Layout.Content
                    v-slots={{ default: () => <span>Foundation content</span> }}
                  />
                </>
              ),
            }}
          />
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
