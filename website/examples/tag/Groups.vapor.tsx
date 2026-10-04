import { defineVaporComponent, ref, shallowRef, type Ref } from "vue";
import { For } from "vue-jsx/vapor";
import { SplitTagGroup, Tag, TagGroup, provideAriaIdScope } from "semi-ui-vue";
import type { TagProps } from "semi-ui-vue/tag";
type Member = TagProps & { readonly "data-member": string };
export default defineVaporComponent(() => {
  provideAriaIdScope(
    `tag-demo-${crypto.getRandomValues(new Uint32Array(4)).join("-")}`,
  );
  const events = ref<readonly string[]>([]);
  const members = shallowRef<readonly Member[]>(
    ["a", "b", "c", "d", "e"].map((key) => ({
      tagKey: key,
      children: `成员 ${key.toUpperCase()}`,
      color: "blue",
      closable: true,
      "data-member": key,
      onClose: () => {
        events.value = [...events.value, `item:${key}`];
      },
    })),
  );
  const mounted = ref(true);
  const split = shallowRef(["a", "b", "c"]);
  const customClicks = ref(0);
  const custom = [
    () => (
      <Tag>
        {() => (
          <button
            onClick={() => {
              customClicks.value++;
            }}
            type="button"
          >
            自定义标签操作
          </button>
        )}
      </Tag>
    ),
    () => <Tag children="独立内容" color="green" />,
  ];
  let next = 1;
  return (
    <section data-tag-groups="">
      <h3>数量折叠、关闭列表与组合标签</h3>
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
            const [first, second, ...rest] = members.value;
            if (first && second) members.value = [second, first, ...rest];
          }}
          type="button"
        >
          交换前两项
        </button>
        <button
          onClick={() => {
            const key = `new-${next++}`;
            members.value = [
              ...members.value,
              {
                tagKey: key,
                children: "新增成员",
                closable: true,
                "data-member": key,
              },
            ];
          }}
          type="button"
        >
          添加一项
        </button>
        <button
          onClick={() => {
            mounted.value = !mounted.value;
          }}
          type="button"
        >
          {mounted.value ? "卸载标签组" : "重挂标签组"}
        </button>
      </div>
      {mounted.value ? (
        <div data-tag-list="">
          <TagGroup
            maxTagCount={3}
            onTagClose={(_children, _event, key) => {
              events.value = [...events.value, `group:${key}`];
              members.value = members.value.filter(
                (item) => item.tagKey !== key,
              );
            }}
            popoverProps={{
              trigger: "click",
              motion: false,
              className: "tag-demo-rest",
            }}
            showPopover
            size="large"
            tagList={members.value}
          />
        </div>
      ) : null}
      <output data-tag-group-events="">{events.value.join("|")}</output>
      <p>自定义模式：每项函数拥有自己的原生内容与关闭策略。</p>
      <TagGroup mode="custom" tagList={custom} />
      <output data-tag-custom-count="">{customClicks.value}</output>
      <p>组合标签：首尾圆角由直接子元素的位置决定。</p>
      <div data-tag-split="">
        <SplitTagGroup aria-label="状态组合">
          {() => (
            <For getKey={(key: string) => key} in={split.value}>
              {(key: Ref<string>) => (
                <Tag
                  children={`状态 ${key.value.toUpperCase()}`}
                  color="cyan"
                  data-split={key.value}
                  shape="circle"
                  type="solid"
                />
              )}
            </For>
          )}
        </SplitTagGroup>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: "16px",
        }}
      >
        <button
          onClick={() => {
            split.value = [...split.value].reverse();
          }}
          type="button"
        >
          反转组合标签
        </button>
        <button
          onClick={() => {
            split.value = split.value.slice(1);
          }}
          type="button"
        >
          移除组合首项
        </button>
      </div>
    </section>
  );
});
