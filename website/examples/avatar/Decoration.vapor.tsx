import { defineVaporComponent, ref } from "vue";
import { Avatar } from "semi-ui-vue";

export default defineVaporComponent(() => {
  const decoration = ref(true);
  const entered = ref(0);
  const left = ref(0);
  const maskEntered = ref(0);
  const maskLeft = ref(0);
  const richClicks = ref(0);
  return (
    <section data-avatar-decoration="">
      <h3>顶部内容、底部内容、边框和悬停覆盖</h3>
      <button
        onClick={() => {
          decoration.value = !decoration.value;
        }}
        type="button"
      >
        切换装饰
      </button>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "40px",
          padding: "36px 16px",
        }}
      >
        <Avatar
          border={
            decoration.value
              ? { color: "var(--semi-color-primary)", motion: false }
              : undefined
          }
          bottomSlot={
            decoration.value
              ? {
                  text: "在线",
                  shape: "square",
                  bgColor: "var(--semi-color-success)",
                }
              : undefined
          }
          children="主播"
          color="pink"
          data-avatar-decorated=""
          hoverMask={() => <span>编辑</span>}
          onMouseEnter={() => {
            entered.value++;
          }}
          onMouseLeave={() => {
            left.value++;
          }}
          size="large"
          topSlot={
            decoration.value
              ? {
                  text: "直播",
                  gradientStart: "#ef4b6c",
                  gradientEnd: "#7f42c2",
                }
              : undefined
          }
        />
        <Avatar
          children="头像"
          color="blue"
          data-avatar-hover-example=""
          hoverMask={() => (
            <span
              data-avatar-mask-text=""
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                background: "rgba(0, 0, 0, 0.65)",
                color: "white",
                fontSize: "14px",
              }}
            >
              编辑
            </span>
          )}
          onMouseEnter={() => {
            maskEntered.value++;
          }}
          onMouseLeave={() => {
            maskLeft.value++;
          }}
          size="large"
        />
        <Avatar color="light-blue" size="large">
          {() => (
            <>
              <button
                aria-label="原生内容操作"
                data-avatar-rich-action=""
                onClick={() => {
                  richClicks.value++;
                }}
                style={{ fontSize: "12px" }}
                type="button"
              >
                原生
              </button>
              <span aria-hidden="true">✦</span>
            </>
          )}
        </Avatar>
      </div>
      <p>
        进入 <output data-avatar-enter-count="">{entered.value}</output>；离开{" "}
        <output data-avatar-leave-count="">{left.value}</output>；原生操作{" "}
        <output data-avatar-rich-count="">{richClicks.value}</output>
      </p>
      <p>
        独立覆盖层进入{" "}
        <output data-avatar-mask-enter="">{maskEntered.value}</output>；离开{" "}
        <output data-avatar-mask-leave="">{maskLeft.value}</output>
      </p>
      <p>顶部装饰可能盖住默认位于左上角的悬停文字；独立头像展示居中覆盖层。</p>
    </section>
  );
});
