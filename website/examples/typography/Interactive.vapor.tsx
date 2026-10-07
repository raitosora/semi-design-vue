import {
  defineVaporComponent,
  onMounted,
  onUnmounted,
  ref,
  type Ref,
} from "vue";
import { For } from "vue-jsx/vapor";
import { Typography, provideAriaIdScope } from "semi-ui-vue";
const text =
  "原生 Vapor 排版组件在真实容器中测量长文本，宽度和字体变化后重新计算，展开后保留完整内容。";
export default defineVaporComponent(() => {
  provideAriaIdScope(
    `typography-interactive-${crypto.getRandomValues(new Uint32Array(4)).join("-")}`,
  );
  const wide = ref(false),
    hidden = ref(false),
    large = ref(false),
    short = ref(false);
  const mounted = ref(true),
    members = ref(["甲", "乙", "丙"]),
    next = ref(1);
  const mounts = ref(0),
    unmounts = ref(0),
    copied = ref("尚未复制"),
    expanded = ref(false);
  const Content = defineVaporComponent(() => {
    onMounted(() => {
      mounts.value++;
    });
    onUnmounted(() => {
      unmounts.value++;
    });
    return (
      <>
        <input aria-label="原生内容输入" value="原生内容" />
        <span>多根内容</span>
      </>
    );
  });
  return (
    <section data-typography-interactive="">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button
          onClick={() => {
            wide.value = !wide.value;
          }}
          type="button"
        >
          切换宽度
        </button>
        <button
          onClick={() => {
            hidden.value = !hidden.value;
          }}
          type="button"
        >
          切换隐藏
        </button>
        <button
          onClick={() => {
            large.value = !large.value;
          }}
          type="button"
        >
          切换字体
        </button>
        <button
          onClick={() => {
            short.value = !short.value;
          }}
          type="button"
        >
          切换文本
        </button>
        <button
          onClick={() => {
            mounted.value = !mounted.value;
          }}
          type="button"
        >
          {mounted.value ? "卸载内容" : "重挂内容"}
        </button>
        <button
          onClick={() => {
            members.value = [...members.value].reverse();
          }}
          type="button"
        >
          反转列表
        </button>
        <button
          onClick={() => {
            members.value = [...members.value, `新${next.value++}`];
          }}
          type="button"
        >
          添加列表项
        </button>
        <button
          onClick={() => {
            members.value = members.value.slice(1);
          }}
          type="button"
        >
          移除首项
        </button>
      </div>
      <div
        data-measure-box=""
        style={{
          width: wide.value ? "520px" : "220px",
          maxWidth: "100%",
          display: hidden.value ? "none" : "block",
        }}
      >
        <Typography.Paragraph
          children={short.value ? "短文本" : text}
          data-ellipsis=""
          ellipsis={{
            rows: 2,
            expandable: true,
            collapsible: true,
            showTooltip: true,
            onExpand: (value) => {
              expanded.value = value;
            },
          }}
          style={{
            fontSize: large.value ? "22px" : "14px",
            padding: "8px",
            border: "1px solid var(--semi-color-border)",
            boxSizing: "border-box",
          }}
        />
        <Typography.Text
          children={text}
          data-middle=""
          ellipsis={{ pos: "middle", suffix: ".txt" }}
          style={{ width: "100%" }}
        />
        <Typography.Text
          children={text}
          copyable={{
            content: "复制的完整原文",
            onCopy: (_event, content, result) => {
              copied.value = `${content}:${result}`;
            },
          }}
          data-copy=""
          ellipsis={{ showTooltip: true }}
          style={{ width: "100%" }}
        />
        <Typography.Text
          children={text}
          data-css-ellipsis=""
          ellipsis={{ showTooltip: true }}
          style={{ width: "100%" }}
        />
        <Typography.Text
          children={text}
          data-popover-ellipsis=""
          ellipsis={{ showTooltip: { type: "popover" } }}
          style={{ width: "100%" }}
        />
      </div>
      <output data-expanded="">{String(expanded.value)}</output>
      <output data-copy-result="">{copied.value}</output>
      <div data-owned-content="">
        {mounted.value ? (
          <Typography.Text>{() => <Content />}</Typography.Text>
        ) : null}
        <output data-mounts="">{mounts.value}</output>
        <output data-unmounts="">{unmounts.value}</output>
      </div>
      <Typography.Text>
        {() => (
          <For getKey={(item: string) => item} in={members.value}>
            {(item: Ref<string>) => (
              <input
                aria-label={`排版成员${item.value}`}
                data-member={item.value}
                value={item.value}
              />
            )}
          </For>
        )}
      </Typography.Text>
    </section>
  );
});
