import type { InjectionKey } from "vue";

export interface LayoutSiderRegistry {
  add(id: symbol): void;
  remove(id: symbol): void;
}

export const layoutSiderRegistryKey: InjectionKey<LayoutSiderRegistry> = Symbol(
  "semi-layout-sider-registry",
);
