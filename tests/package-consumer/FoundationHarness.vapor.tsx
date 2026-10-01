import { defineVaporComponent, ref } from "vue";
import {
  Col,
  Layout,
  Row,
  Space,
  Tooltip,
  Popover,
  OverflowList,
  provideAriaIdScope,
} from "semi-ui-vue";
import { FoundationInput } from "../../website/examples/foundation/Input.vapor";
import { FoundationTooltip } from "../../website/examples/foundation/Tooltip.vapor";
import { Model } from "../fixtures/Model.vapor";
import {
  StrictFixture,
  type StrictFixtureExposed,
} from "../types/StrictFixture";

/** Validation only: compile existing examples into a private local tarball. */
export const FoundationHarness = defineVaporComponent(() => {
  provideAriaIdScope("foundation-harness-consumer");
  const input = ref("initial-input");
  const model = ref("initial-model");
  const api = ref<StrictFixtureExposed | null>(null);
  const alive = ref(true);
  const changes = ref(0);
  const visible = ref(false);
  const exposed = ref("");
  const overflowWidth = ref(155);
  const overflowLabel = ref("Foundation");
  const overflowChanges = ref(0);
  const overflowItems = ref([{ key: "a" }, { key: "b" }, { key: "c" }]);
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
          <OverflowList
            className="foundation-overflow-list"
            collapseFrom="end"
            itemKey="key"
            items={overflowItems.value}
            minVisibleItems={0}
            onOverflow={() => overflowChanges.value++}
            style={{ width: `${overflowWidth.value}px` }}
            v-slots={{
              visibleItem: (scope) => (
                <button
                  data-foundation-overflow-index={scope.index}
                  data-foundation-overflow-item={String(scope.item.key)}
                  style={{
                    flex: "0 0 60px",
                    width: "60px",
                    padding: "0",
                    border: "0",
                  }}
                >
                  {`${overflowLabel.value} ${String(scope.item.key)}`}
                </button>
              ),
              overflow: (scope) => (
                <button
                  data-foundation-overflow-count={scope.items.length}
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
          <Tooltip
            content="Public packed Tooltip"
            motion={false}
            trigger="click"
            v-slots={{
              default: (scope) => (
                <button
                  {...scope.attrs}
                  {...scope.triggerProps}
                  data-foundation-public-tooltip=""
                  ref={scope.triggerRef}
                >
                  Public Tooltip trigger
                </button>
              ),
            }}
            wrapperId="foundation-public-tooltip"
          />
          <Popover
            content="Public packed Popover"
            motion={false}
            trigger="click"
            v-slots={{
              default: (scope) => (
                <button
                  {...scope.attrs}
                  {...scope.triggerProps}
                  data-foundation-public-popover=""
                  ref={scope.triggerRef}
                >
                  Public Popover trigger
                </button>
              ),
            }}
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
      <output id="overflow-changes">{overflowChanges.value}</output>
      <button
        id="overflow-resize"
        onClick={() => {
          overflowWidth.value = 220;
          overflowItems.value = [
            overflowItems.value[2],
            overflowItems.value[0],
            { key: "d" },
          ];
          overflowLabel.value = "Updated Foundation";
        }}
      >
        Resize OverflowList
      </button>
      <button id="overflow-narrow" onClick={() => (overflowWidth.value = 95)}>
        Narrow OverflowList
      </button>
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
