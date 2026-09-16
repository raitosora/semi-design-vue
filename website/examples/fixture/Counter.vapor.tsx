import { defineVaporComponent, onMounted, onUnmounted, ref } from "vue";

export default defineVaporComponent(
  (props: { label?: string }) => {
    const count = ref(0);
    onMounted(() => {
      const emit = (phase: string) =>
        window.dispatchEvent(
          new CustomEvent("docs-fixture", { detail: phase }),
        );
      const pulse = () => emit("pulse");
      window.addEventListener("docs-pulse", pulse);
      const timer = window.setInterval(() => emit("tick"), 100);
      emit("mounted");
      onUnmounted(() => {
        clearInterval(timer);
        window.removeEventListener("docs-pulse", pulse);
        emit("unmounted");
      });
    });
    return (
      <section data-fixture="counter">
        <h3>{props.label ?? "独立计数器"}</h3>
        <button
          onClick={() => {
            count.value += 1;
          }}
        >
          计数：{count.value}
        </button>
        <p v-if={count.value > 0}>状态由当前 Vapor 应用独立持有。</p>
      </section>
    );
  },
  { props: ["label"] },
);
