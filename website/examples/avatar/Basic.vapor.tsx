import { defineVaporComponent, ref } from "vue";
import { Avatar } from "semi-ui-vue";

const image = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="#356fe5"/><circle cx="40" cy="30" r="14" fill="#fff"/><path d="M12 80a28 28 0 0 1 56 0" fill="#fff"/></svg>')}`;
const sizes = [
  "extra-extra-small",
  "extra-small",
  "small",
  "default",
  "medium",
  "large",
  "extra-large",
] as const;
export default defineVaporComponent(() => {
  const failed = ref(false);
  const errors = ref(0);
  const clicks = ref(0);
  return (
    <section data-avatar-basic="">
      <h3>尺寸、形状、图片与文字</h3>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {sizes.map((size) => (
          <Avatar children="A" data-avatar-size={size} key={size} size={size} />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "center",
          marginBlock: "20px",
        }}
      >
        <Avatar
          children="方"
          color="blue"
          data-avatar-square=""
          shape="square"
        />
        <Avatar
          alt="演示头像"
          children="AB"
          data-avatar-image=""
          onError={() => {
            errors.value++;
          }}
          src={failed.value ? "data:image/png;base64,AA==" : image}
        />
        <Avatar
          alt="打开个人资料"
          children="我"
          color="green"
          data-avatar-action=""
          onClick={() => {
            clicks.value++;
          }}
        />
      </div>
      <button
        onClick={() => {
          failed.value = !failed.value;
        }}
        type="button"
      >
        {failed.value ? "恢复图片" : "模拟图片失败"}
      </button>
      <p>
        图片失败次数：<output data-avatar-errors="">{errors.value}</output>
        ；头像操作次数：<output data-avatar-clicks="">{clicks.value}</output>
      </p>
      <p>
        可点击文字头像可聚焦，Enter 激活，Escape 取消焦点。图片提供
        alt；纯装饰图片可显式设为空字符串。
      </p>
    </section>
  );
});
