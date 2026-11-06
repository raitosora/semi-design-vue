import { defineVaporComponent, ref } from "vue";
import { Icon, Steps } from "semi-ui-vue";
import { IconHome } from "semi-icons-vue";

export default defineVaporComponent(() => {
  const small = ref(true),
    hasLine = ref(true),
    vertical = ref(true),
    nav = ref(1);
  return (
    <section data-steps-variants="">
      <h3>简易版、状态与自定义图标</h3>
      <button
        onClick={() => {
          small.value = !small.value;
        }}
        type="button"
      >
        切换尺寸
      </button>
      <button
        onClick={() => {
          hasLine.value = !hasLine.value;
        }}
        type="button"
      >
        切换连线
      </button>
      <Steps
        current={1}
        data-variant-basic=""
        hasLine={hasLine.value}
        size={small.value ? "small" : "default"}
        status="error"
        type="basic"
      >
        {() => (
          <>
            <Steps.Step
              className="explicit-class"
              description="显式 warning 保留；前项类由父 error 覆盖"
              status="warning"
              title="需关注"
            />
            <Steps.Step description={0} title="处理失败" />
            <Steps.Step
              description="命名 slot 提供原生图标"
              status="wait"
              title="自定义"
            >
              {{
                icon: () => (
                  <Icon size="extra-large" type="home">
                    {() => <IconHome aria-hidden="true" size="inherit" />}
                  </Icon>
                ),
              }}
            </Steps.Step>
          </>
        )}
      </Steps>
      <h4>填充式方向</h4>
      <button
        onClick={() => {
          vertical.value = !vertical.value;
        }}
        type="button"
      >
        切换方向
      </button>
      <Steps
        current={1}
        data-variant-fill=""
        direction={vertical.value ? "vertical" : "horizontal"}
      >
        {() => (
          <>
            <Steps.Step description="已有结果" title="已完成" />
            <Steps.Step description="继续推进" title="进行中" />
            <Steps.Step description="等待开始" title="等待" />
          </>
        )}
      </Steps>
      <h4>导航式步骤</h4>
      <Steps
        current={nav.value}
        data-variant-nav=""
        onChange={(index) => {
          nav.value = index;
        }}
        size={small.value ? "small" : "default"}
        type="nav"
      >
        {() => (
          <>
            <Steps.Step description="不显示的描述" title="账号" />
            <Steps.Step title="选择用途" />
            <Steps.Step title="确认" />
          </>
        )}
      </Steps>
      <p>
        导航选中位置：<output data-nav-result="">{nav.value}</output>
      </p>
      <p>
        导航式仅呈现标题与箭头，最后一项不显示箭头；固定实现支持点击和
        Enter。Space 与方向键没有 Steps 导航协议。
      </p>
    </section>
  );
});
