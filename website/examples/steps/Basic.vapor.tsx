import { defineVaporComponent, ref } from "vue";
import { Steps, Step } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const current = ref(1),
    events = ref<string[]>([]),
    offset = ref<number | undefined>();
  const record = (value: string) => {
    events.value = [...events.value, value];
  };
  return (
    <section data-steps-basic="">
      <h3>默认填充式步骤与受控进度</h3>
      <button
        onClick={() => {
          current.value = Math.max(0, current.value - 1);
        }}
        type="button"
      >
        上一步
      </button>
      <button
        onClick={() => {
          current.value = Math.min(2, current.value + 1);
        }}
        type="button"
      >
        下一步
      </button>
      <button
        onClick={() => {
          events.value = [];
        }}
        type="button"
      >
        清空事件
      </button>
      <div
        onClick={() => record("bubble")}
        onKeydown={(event) => {
          if ((event as unknown as KeyboardEvent).key === "Enter")
            record("key-bubble");
        }}
      >
        <Steps
          aria-label="办理进度"
          current={current.value}
          data-basic-steps=""
          onChange={(index) => {
            record(`change:${index}`);
            current.value = index;
          }}
        >
          {() => (
            <>
              <Step
                description="填写必要资料"
                onClick={() => record("click:0")}
                onKeyDown={() => record("key:0")}
                title="开始"
              />
              <Steps.Step
                description="等待处理"
                onClick={() => record("click:1")}
                onKeyDown={() => record("key:1")}
                title="<b>审核</b>"
              />
              <Steps.Step
                description="原生链接保留默认跳转"
                onClick={() => record("click:2")}
                onKeyDown={() => record("key:2")}
              >
                {{ title: () => <a href="#steps-details">查看详情</a> }}
              </Steps.Step>
            </>
          )}
        </Steps>
      </div>
      <p>
        当前步骤：<output data-current="">{current.value}</output>；事件顺序：
        <output data-events="">{events.value.join(",")}</output>
      </p>
      <h4>起始序号与通知参数</h4>
      <Steps
        current={6}
        data-offset-steps=""
        initial={5}
        onChange={(index) => {
          offset.value = index;
        }}
        type="basic"
      >
        {() => (
          <>
            <Steps.Step title="第六步" />
            <Steps.Step title="第七步" />
            <Steps.Step title="第八步" />
          </>
        )}
      </Steps>
      <p>
        通知序号：<output data-offset-result="">{offset.value}</output>
      </p>
      <p>
        current 由调用方更新。initial=5、current=6 时第二项进行中；点击它仍通知
        6，因为固定实现以位置索引和 current 比较是否通知。
      </p>
    </section>
  );
});
