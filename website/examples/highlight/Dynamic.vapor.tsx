import { defineVaporComponent, ref } from "vue";
import { Highlight } from "semi-ui-vue";
import type { HighlightProps } from "semi-ui-vue/highlight";

export default defineVaporComponent(() => {
  const source = ref("Semi SEMI semi / Design");
  const words = ref(["semi"]);
  const mounted = ref(true);
  const options = ref<
    Pick<HighlightProps, "component" | "caseSensitive" | "autoEscape">
  >({});
  return (
    <section data-highlight-dynamic="">
      <h3>文本、关键词与标签更新</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <label>
          源文本
          <input
            aria-label="高亮源文本"
            onInput={(event) =>
              (source.value = (event.target as HTMLInputElement).value)
            }
            value={source.value}
          />
        </label>
        <label>
          关键词
          <input
            aria-label="高亮关键词"
            onInput={(event) =>
              (words.value = (event.target as HTMLInputElement).value.split(
                ",",
              ))
            }
            value={words.value.join(",")}
          />
        </label>
        <button
          onClick={() =>
            (options.value = {
              component: "strong",
              caseSensitive: true,
              autoEscape: true,
            })
          }
          type="button"
        >
          使用 strong 和大小写敏感
        </button>
        <button
          onClick={() =>
            (options.value = {
              component: undefined,
              caseSensitive: undefined,
              autoEscape: undefined,
            })
          }
          type="button"
        >
          设为 undefined
        </button>
        <button onClick={() => (options.value = {})} type="button">
          移除可选属性
        </button>
        <button
          onClick={() => {
            source.value = "旧文本";
            words.value = ["旧"];
            source.value = "最终文本 😀";
            words.value = ["最终", "😀"];
          }}
          type="button"
        >
          快速更新
        </button>
        <button onClick={() => (mounted.value = !mounted.value)} type="button">
          {mounted.value ? "卸载 Highlight" : "挂载 Highlight"}
        </button>
      </div>
      <p
        aria-live="polite"
        data-highlight-live=""
        style={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}
      >
        <Highlight
          v-if={mounted.value}
          {...options.value}
          searchWords={words.value}
          sourceString={source.value}
        />
      </p>
    </section>
  );
});
