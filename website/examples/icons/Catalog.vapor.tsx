import {
  computed,
  createVaporApp,
  defineVaporComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { resourceCatalog, type ResourceCatalogEntry } from "./catalog.js";

type PackageName = ResourceCatalogEntry["packageName"] | "all";
type VaporModule = { default: ReturnType<typeof defineVaporComponent> };

const loaders = {
  "semi-icons-vue": import.meta.glob<VaporModule>(
    "../../../packages/semi-icons-vue/dist/icons/*.js",
  ),
  "semi-icons-lab-vue": import.meta.glob<VaporModule>(
    "../../../packages/semi-icons-lab-vue/dist/icons/*.js",
  ),
  "semi-illustrations-vue": import.meta.glob<VaporModule>(
    "../../../packages/semi-illustrations-vue/dist/illustrations/*.js",
  ),
};

function loaderFor(entry: ResourceCatalogEntry) {
  const collection =
    entry.packageName === "semi-illustrations-vue" ? "illustrations" : "icons";
  const key = `../../../packages/${entry.packageName}/dist/${collection}/${entry.name}.js`;
  return loaders[entry.packageName][key];
}

export default defineVaporComponent(() => {
  const query = ref("");
  const packageName = ref<PackageName>("all");
  const selected = ref<ResourceCatalogEntry>(
    resourceCatalog.find((entry) => entry.name === "IconHome") ??
      resourceCatalog[0],
  );
  const previewHost = ref<HTMLElement>();
  const previewError = ref("");
  let previewDispose: (() => void) | undefined;
  let generation = 0;

  const entries = computed(() => {
    const normalized = query.value.trim().toLowerCase();
    return resourceCatalog.filter(
      (entry) =>
        (packageName.value === "all" ||
          entry.packageName === packageName.value) &&
        (!normalized || entry.name.toLowerCase().includes(normalized)),
    );
  });
  const counts = computed(() => ({
    icons: resourceCatalog.filter(
      (entry) => entry.packageName === "semi-icons-vue",
    ).length,
    lab: resourceCatalog.filter(
      (entry) => entry.packageName === "semi-icons-lab-vue",
    ).length,
    illustrations: resourceCatalog.filter(
      (entry) => entry.packageName === "semi-illustrations-vue",
    ).length,
  }));
  const loadPreview = async () => {
    previewDispose?.();
    previewDispose = undefined;
    previewError.value = "";
    const current = ++generation;
    const load = loaderFor(selected.value);
    if (!load || !previewHost.value) {
      previewError.value = "无法加载此资源预览";
      return;
    }
    try {
      const { default: component } = await load();
      if (current !== generation || !previewHost.value) return;
      const app = createVaporApp(component, {
        size: 32,
        "aria-hidden": "true",
      });
      app.mount(previewHost.value);
      previewDispose = () => app.unmount();
    } catch (cause) {
      if (current === generation)
        previewError.value =
          cause instanceof Error ? cause.message : String(cause);
    }
  };
  onMounted(() => void loadPreview());
  watch(selected, () => void loadPreview());
  onBeforeUnmount(() => {
    generation += 1;
    previewDispose?.();
  });

  return (
    <section aria-label="图标与插画目录" data-icon-catalog="">
      <p data-icon-catalog-count="">
        共 {resourceCatalog.length} 项：{counts.value.icons} 个图标、
        {counts.value.lab} 个实验图标、{counts.value.illustrations} 个插画。
      </p>
      <label>
        搜索资源名称
        <input
          aria-label="搜索资源名称"
          onInput={(event) =>
            (query.value = (event.target as HTMLInputElement).value)
          }
          placeholder="例如 IconHome"
          value={query.value}
        />
      </label>
      <label>
        资源包
        <select
          aria-label="资源包"
          onChange={(event) =>
            (packageName.value = (event.target as HTMLSelectElement)
              .value as PackageName)
          }
          value={packageName.value}
        >
          <option value="all">全部资源</option>
          <option value="semi-icons-vue">semi-icons-vue</option>
          <option value="semi-icons-lab-vue">semi-icons-lab-vue</option>
          <option value="semi-illustrations-vue">semi-illustrations-vue</option>
        </select>
      </label>
      <p aria-live="polite" data-icon-result-count="">
        找到 {entries.value.length} 项
      </p>
      <ul data-icon-catalog-results="">
        {entries.value.slice(0, 60).map((entry) => (
          <li key={`${entry.packageName}/${entry.name}`}>
            <button onClick={() => (selected.value = entry)} type="button">
              {entry.name}
            </button>
            <code>
              {entry.packageName}/{entry.name}
            </code>
          </li>
        ))}
      </ul>
      {entries.value.length > 60 && (
        <p>为保持目录轻量，仅显示前 60 项；请继续搜索缩小结果。</p>
      )}
      <aside aria-label="所选资源预览" data-icon-preview="">
        <div data-icon-preview-host="" ref={previewHost} />
        <strong>{selected.value.name}</strong>
        <code>
          {selected.value.packageName}/{selected.value.name}
        </code>
        {previewError.value && <p role="alert">{previewError.value}</p>}
      </aside>
    </section>
  );
});
