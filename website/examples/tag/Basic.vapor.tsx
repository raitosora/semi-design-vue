import { defineVaporComponent, ref } from "vue";
import { Avatar, Tag } from "semi-ui-vue";
const colors = [
  "amber",
  "blue",
  "cyan",
  "green",
  "grey",
  "indigo",
  "light-blue",
  "light-green",
  "lime",
  "orange",
  "pink",
  "purple",
  "red",
  "teal",
  "violet",
  "yellow",
  "white",
] as const;
const picture = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="${color}"/><circle cx="20" cy="16" r="8" fill="white"/><path d="M5 40a15 15 0 0 1 30 0" fill="white"/></svg>`)}`;
export default defineVaporComponent(() => {
  const updated = ref(false);
  const clicks = ref(0);
  return (
    <section data-tag-basic="">
      <h3>颜色、形状、头像与原生内容</h3>
      <div
        data-tag-palette=""
        style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
      >
        {colors.map((color) => (
          <Tag children={color} color={color} key={color} />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBlock: "16px",
          alignItems: "center",
        }}
      >
        <Tag children="小尺寸" data-tag-small="" size="small" />
        <Tag
          children="大尺寸"
          color="blue"
          data-tag-large=""
          size="large"
          type="solid"
        />
        <Tag
          children="胶囊"
          color="green"
          data-tag-circle=""
          shape="circle"
          type="ghost"
        />
        <Tag children="多彩渐变" colorful gradient type="light" />
        <Tag
          avatarShape="circle"
          avatarSrc={picture(updated.value ? "#824be5" : "#2878db")}
          children={updated.value ? "更新成员" : "团队成员"}
          data-tag-avatar=""
          size="large"
        />
        <Tag data-tag-described-avatar="" size="large">
          {() => (
            <>
              <Avatar
                alt="设计团队标识"
                size="extra-extra-small"
                src={picture("#267c58")}
              />
              <span>设计团队</span>
            </>
          )}
        </Tag>
        <Tag
          prefixIcon={() => <span aria-hidden="true">★</span>}
          suffixIcon={() => <span aria-hidden="true">✓</span>}
        >
          {() => (
            <button
              onClick={() => {
                clicks.value++;
              }}
              type="button"
            >
              内容操作
            </button>
          )}
        </Tag>
      </div>
      <button
        onClick={() => {
          updated.value = !updated.value;
        }}
        type="button"
      >
        更新头像与内容
      </button>
      <p>
        内容操作次数：<output data-tag-content-count="">{clicks.value}</output>
      </p>
    </section>
  );
});
