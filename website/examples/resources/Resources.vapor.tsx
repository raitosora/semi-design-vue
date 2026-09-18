import { defineVaporComponent, ref } from "vue";
import { IconHome } from "semi-icons-vue";
import { IconDatePicker } from "semi-icons-lab-vue";
import { IllustrationNoContent } from "semi-illustrations-vue";
import zhCN from "semi-ui-vue/locale/source/zh_CN";
import enUS from "semi-ui-vue/locale/source/en_US";

export default defineVaporComponent(() => {
  const expanded = ref(false);
  const english = ref(false);
  return (
    <section data-resource-demo="">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        <IconHome
          color={expanded.value ? "#7c3aed" : "#1169aa"}
          data-resource-home=""
          size={expanded.value ? 32 : 16}
        />
        <IconDatePicker size={40} />
        <IconDatePicker size={40} />
        <IllustrationNoContent size={120} />
      </div>
      <p>
        <button onClick={() => (expanded.value = !expanded.value)}>
          放大并改色
        </button>
        <button onClick={() => (english.value = !english.value)}>
          切换语言数据
        </button>
      </p>
      <p data-resource-locale="">
        {english.value ? enUS.Modal.confirm : zhCN.Modal.confirm}
      </p>
    </section>
  );
});
