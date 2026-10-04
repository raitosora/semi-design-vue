import { defineVaporComponent, ref, shallowRef, type Ref } from "vue";
import { For } from "vue-jsx/vapor";
import { Avatar, AvatarGroup, Popover, provideAriaIdScope } from "semi-ui-vue";
import type { AvatarGroupItem } from "semi-ui-vue/avatar";

const initial = [
  { key: "a", label: "AL" },
  { key: "b", label: "BK" },
  { key: "c", label: "CY" },
  { key: "d", label: "DL" },
  { key: "e", label: "EM" },
];
type Member = (typeof initial)[number];
export default defineVaporComponent(() => {
  provideAriaIdScope(
    `avatar-group-${crypto.getRandomValues(new Uint32Array(4)).join("-")}`,
  );
  const members = shallowRef([...initial]);
  const all = ref(false);
  const square = ref(false);
  const mounted = ref(true);
  const end = ref(false);
  const selected = ref("");
  let nextKey = 1;
  const renderMore = (count: number, rest: readonly AvatarGroupItem[]) => (
    <Popover
      contentClassName="avatar-more-popover"
      motion={false}
      trigger="click"
    >
      {{
        default: (scope) => (
          <button
            {...scope.attrs}
            {...scope.triggerProps}
            aria-label={`查看其余 ${count} 位成员`}
            ref={scope.triggerRef}
            type="button"
          >
            +{count}
          </button>
        ),
        content: () => (
          <p data-avatar-more-content="">
            {rest.map((item) => item.label).join("、")}
          </p>
        ),
      }}
    </Popover>
  );
  return (
    <section data-avatar-groups="">
      <h3>头像组的折叠、稳定 key 与上下文</h3>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <button
          onClick={() => {
            all.value = !all.value;
          }}
          type="button"
        >
          {all.value ? "恢复折叠" : "展示全部成员"}
        </button>
        <button
          onClick={() => {
            members.value = [...members.value].reverse();
          }}
          type="button"
        >
          反转成员
        </button>
        <button
          onClick={() => {
            members.value = members.value.slice(1);
          }}
          type="button"
        >
          移除首位成员
        </button>
        <button
          onClick={() => {
            members.value = [
              ...members.value,
              { key: `new-${nextKey++}`, label: "新" },
            ];
          }}
          type="button"
        >
          添加成员
        </button>
        <button
          onClick={() => {
            end.value = !end.value;
          }}
          type="button"
        >
          切换覆盖方向
        </button>
        <button
          onClick={() => {
            square.value = !square.value;
          }}
          type="button"
        >
          切换组尺寸形状
        </button>
        <button
          onClick={() => {
            mounted.value = !mounted.value;
          }}
          type="button"
        >
          {mounted.value ? "卸载头像组" : "重挂头像组"}
        </button>
      </div>
      {mounted.value ? (
        <div data-avatar-group="dynamic">
          <AvatarGroup
            maxCount={all.value ? undefined : 3}
            overlapFrom={end.value ? "end" : "start"}
            shape={square.value ? "square" : "circle"}
            size={square.value ? "medium" : "default"}
          >
            {() => (
              <For getKey={(member: Member) => member.key} in={members.value}>
                {(member: Ref<Member>) => (
                  <Avatar
                    alt={member.value.label}
                    children={member.value.label}
                    color="blue"
                    data-member={member.value.key}
                    onClick={() => {
                      selected.value = member.value.key;
                    }}
                  />
                )}
              </For>
            )}
          </AvatarGroup>
        </div>
      ) : null}
      <output data-avatar-member-selected="">{selected.value}</output>
      <p>自定义更多：使用已交付 Popover 和原生 button。</p>
      <AvatarGroup
        maxCount={3}
        overlapFrom="end"
        renderMore={renderMore}
        size="default"
      >
        {() => (
          <>
            {initial.map((member) => (
              <Avatar
                alt={member.label}
                children={member.label}
                color="orange"
                key={member.key}
              />
            ))}
          </>
        )}
      </AvatarGroup>
      <p>
        默认 +N
        不打开浮层。折叠头像保留所属原生子树并停止交互；更改数量可恢复相同 DOM。
      </p>
    </section>
  );
});
