import { defineVaporComponent, onMounted, onUnmounted, ref } from "vue";
import {
  Timeline,
  Descriptions,
  List,
  Card,
  CardGroup,
  Empty,
  Typography,
  Badge,
  Avatar,
  AvatarGroup,
  Tag,
  TagGroup,
  SplitTagGroup,
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
  const timelineLabel = ref("Foundation Timeline");
  const timelineMounts = ref(0);
  const timelineUnmounts = ref(0);
  const TimelineBody = defineVaporComponent(() => {
    onMounted(() => (timelineMounts.value += 1));
    onUnmounted(() => (timelineUnmounts.value += 1));
    return (
      <input aria-label="Timeline body input" value="owned timeline input" />
    );
  });
  const descriptionsLabel = ref("Foundation Descriptions");
  const descriptionsMounts = ref(0);
  const descriptionsUnmounts = ref(0);
  const DescriptionsBody = defineVaporComponent(() => {
    onMounted(() => (descriptionsMounts.value += 1));
    onUnmounted(() => (descriptionsUnmounts.value += 1));
    return (
      <input
        aria-label="Descriptions body input"
        value="owned descriptions input"
      />
    );
  });
  const listHeader = ref("Foundation List");
  const listLoading = ref(false);
  const listMounts = ref(0);
  const listUnmounts = ref(0);
  const ListBody = defineVaporComponent(() => {
    onMounted(() => (listMounts.value += 1));
    onUnmounted(() => (listUnmounts.value += 1));
    return <input aria-label="List body input" value="owned list input" />;
  });
  const cardTitle = ref("Foundation Card");
  const cardLoading = ref(false);
  const cardMounts = ref(0);
  const cardUnmounts = ref(0);
  const CardBody = defineVaporComponent(() => {
    onMounted(() => (cardMounts.value += 1));
    onUnmounted(() => (cardUnmounts.value += 1));
    return <input aria-label="Card body input" value="owned card input" />;
  });
  const emptyTitle = ref("No matches");
  const typographyLabel = ref("Foundation Typography");
  const badgeCount = ref(10);
  const tagLabel = ref("Foundation Tag");
  const tagCount = ref(1);
  const tagCloses = ref(0);
  const avatarLabel = ref("Foundation Avatar");
  const avatarCount = ref(1);
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
          <Timeline
            aria-label="Foundation events"
            data-foundation-timeline=""
            mode="alternate"
          >
            {() => (
              <Timeline.Item time={timelineLabel.value}>
                {() => <TimelineBody />}
              </Timeline.Item>
            )}
          </Timeline>
          <Timeline
            data-foundation-timeline-data=""
            dataSource={[{ content: "First", type: "success" }, { content: 0 }]}
          />
          <Descriptions data-foundation-descriptions="">
            {() => (
              <Descriptions.Item itemKey={descriptionsLabel.value}>
                {() => <DescriptionsBody />}
              </Descriptions.Item>
            )}
          </Descriptions>
          <Descriptions
            column={3}
            data={[
              { key: "Across", value: "Two", span: 2 },
              { key: "Zero", value: 0 },
            ]}
            data-foundation-descriptions-data=""
            layout="horizontal"
          />
          <List
            bordered
            data-foundation-list=""
            header={listHeader.value}
            loading={listLoading.value}
          >
            {() => (
              <List.Item
                extra={() => <button type="button">List action</button>}
                header="Owned item"
              >
                {() => <ListBody />}
              </List.Item>
            )}
          </List>
          <List data-foundation-list-grid="" grid={{ span: 12, gutter: 16 }}>
            {() => (
              <>
                <List.Item main="Grid A" />
                <List.Item main="Grid B" />
              </>
            )}
          </List>
          <CardGroup data-foundation-card-group="" spacing={[12, 20]}>
            {() => (
              <Card
                actions={[() => <button type="button">Card action</button>]}
                data-foundation-card=""
                loading={cardLoading.value}
                title={cardTitle.value}
              >
                {{
                  default: () => (
                    <>
                      <Card.Meta
                        description="Packed native meta"
                        title="Foundation Meta"
                      >
                        {{
                          avatar: () => (
                            <Avatar size="small">{() => <span>C</span>}</Avatar>
                          ),
                        }}
                      </Card.Meta>
                      <CardBody />
                    </>
                  ),
                  footer: () => (
                    <button type="button">Card footer action</button>
                  ),
                }}
              </Card>
            )}
          </CardGroup>
          <Empty
            data-foundation-empty=""
            description="Try another search"
            title={emptyTitle.value}
          >
            {() => <button type="button">Retry search</button>}
          </Empty>
          <Typography.Paragraph className="foundation-typography">
            {() => (
              <button data-foundation-typography-anchor="">
                {typographyLabel.value}
              </button>
            )}
          </Typography.Paragraph>
          <Typography.Numeral
            children={1234.5}
            className="foundation-typography-number"
            precision={2}
            rule="numbers"
          />
          <Badge
            className="foundation-badge"
            count={badgeCount.value}
            overflowCount={9}
          >
            {() => (
              <button data-foundation-badge-anchor="">Foundation Badge</button>
            )}
          </Badge>
          <div data-foundation-tag="">
            <Tag
              children={tagLabel.value}
              className="foundation-tag"
              closable
              onClose={(_value, event) => {
                tagCloses.value++;
                event.preventDefault();
              }}
              tagKey="foundation"
            />
            <TagGroup
              className="foundation-tag-group"
              maxTagCount={tagCount.value}
              tagList={[
                {
                  children: "First",
                  tagKey: "a",
                  className: "foundation-tag-a",
                },
                {
                  children: "Second",
                  tagKey: "b",
                  className: "foundation-tag-b",
                },
              ]}
            />
            <SplitTagGroup
              aria-label="Foundation split"
              className="foundation-tag-split"
            >
              {() => (
                <>
                  <Tag children={tagLabel.value} />
                  <Tag children="Tail" />
                </>
              )}
            </SplitTagGroup>
          </div>
          <div data-foundation-avatar="">
            <Avatar
              children={avatarLabel.value}
              className="foundation-avatar-text"
              gap={4}
              size="small"
            />
            <AvatarGroup maxCount={avatarCount.value} size="small">
              {() => (
                <>
                  <Avatar
                    alt="First Foundation avatar"
                    children="A"
                    className="foundation-avatar-a"
                  />
                  <Avatar
                    alt="Second Foundation avatar"
                    children="B"
                    className="foundation-avatar-b"
                  />
                </>
              )}
            </AvatarGroup>
          </div>
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
      <button
        id="card-update"
        onClick={() => (cardTitle.value = "Updated Card")}
      >
        Update Card
      </button>
      <button
        id="card-loading"
        onClick={() => (cardLoading.value = !cardLoading.value)}
      >
        Toggle Card loading
      </button>
      <button
        id="list-update"
        onClick={() => (listHeader.value = "Updated List")}
      >
        Update List
      </button>
      <button
        id="list-loading"
        onClick={() => (listLoading.value = !listLoading.value)}
      >
        Toggle List loading
      </button>
      <button
        id="timeline-update"
        onClick={() => (timelineLabel.value = "Updated Timeline")}
      >
        Update Timeline
      </button>
      <output id="timeline-mounts">{timelineMounts.value}</output>
      <output id="timeline-unmounts">{timelineUnmounts.value}</output>
      <button
        id="descriptions-update"
        onClick={() => (descriptionsLabel.value = "Updated Descriptions")}
      >
        Update Descriptions
      </button>
      <output id="descriptions-mounts">{descriptionsMounts.value}</output>
      <output id="descriptions-unmounts">{descriptionsUnmounts.value}</output>
      <output id="list-mounts">{listMounts.value}</output>
      <output id="list-unmounts">{listUnmounts.value}</output>
      <output id="card-mounts">{cardMounts.value}</output>
      <output id="card-unmounts">{cardUnmounts.value}</output>
      <button
        id="empty-update"
        onClick={() => (emptyTitle.value = "Search updated")}
      >
        Update Empty
      </button>
      <output id="input-value">{input.value}</output>
      <output id="model-value">{model.value}</output>
      <output id="changes">{changes.value}</output>
      <output id="visible">{String(visible.value)}</output>
      <button
        id="typography-update"
        onClick={() => {
          typographyLabel.value = "Updated Typography";
        }}
      >
        Update Typography
      </button>
      <button
        id="badge-update"
        onClick={() => {
          badgeCount.value = 9;
        }}
      >
        Update Badge
      </button>
      <output id="tag-closes">{tagCloses.value}</output>
      <button
        id="tag-update"
        onClick={() => {
          tagLabel.value = "Updated Tag";
          tagCount.value = 2;
        }}
      >
        Update Tag
      </button>
      <button
        id="avatar-update"
        onClick={() => {
          avatarLabel.value = "Updated Avatar";
          avatarCount.value = 2;
        }}
      >
        Update Avatar
      </button>
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
