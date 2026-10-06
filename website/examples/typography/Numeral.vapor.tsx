import { defineVaporComponent, ref, type Ref } from "vue";
import { For } from "vue-jsx/vapor";
import { Typography } from "semi-ui-vue";
export default defineVaporComponent(() => {
  const value = ref(12345.678);
  const precision = ref(2);
  return (
    <section data-typography-numeral="">
      <button
        onClick={() => {
          value.value = value.value === 0 ? 12345.678 : 0;
        }}
        type="button"
      >
        切换数字与零
      </button>
      <dl>
        <dt>提取数字</dt>
        <dd>
          <Typography.Numeral
            children={value.value}
            data-number=""
            precision={2}
            rule="numbers"
          />
        </dd>
        <dt>向下取整</dt>
        <dd>
          <Typography.Numeral
            children={-1.239}
            data-floor=""
            precision={2}
            truncate="floor"
          />
        </dd>
        <dt>百分比</dt>
        <dd>
          <Typography.Numeral
            children={0.125}
            data-percent=""
            precision={1}
            rule="percentages"
          />
        </dd>
        <dt>十进制字节</dt>
        <dd>
          <Typography.Numeral
            children={1000}
            data-decimal=""
            rule="bytes-decimal"
          />
        </dd>
        <dt>二进制字节</dt>
        <dd>
          <Typography.Numeral
            children={1024}
            data-binary=""
            rule="bytes-binary"
          />
        </dd>
        <dt>科学计数</dt>
        <dd>
          <Typography.Numeral
            children={12345}
            data-exponential=""
            precision={2}
            rule="exponential"
          />
        </dd>
        <dt>自定义 parser</dt>
        <dd>
          <Typography.Numeral
            children={12}
            data-parser=""
            parser={(content) => `值 ${content}`}
          />
        </dd>
      </dl>
      <button
        onClick={() => {
          precision.value = precision.value === 2 ? 1 : 2;
        }}
        type="button"
      >
        切换嵌套精度
      </button>
      <Typography.Numeral precision={precision.value}>
        {{
          default: (scope) => (
            <span data-scoped-list="">
              <For getKey={(item: string) => item} in={["1.256", "42.666"]}>
                {(item: Ref<string>) => (
                  <span data-scoped-item={item.value}>
                    <strong>{scope.format(item.value)}</strong>
                    <input
                      aria-label={`嵌套数字${item.value}`}
                      value={item.value}
                    />
                  </span>
                )}
              </For>
            </span>
          ),
        }}
      </Typography.Numeral>
      <Typography.Numeral>
        {() => (
          <>
            <span data-native-number="">12345.678</span>
            <input aria-label="数字原生插槽" value="保持原值" />
          </>
        )}
      </Typography.Numeral>
    </section>
  );
});
