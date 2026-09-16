import { createVaporApp } from "vue";

// Test-only adapter: no VNode wrapper, proxy introspection or interop plugin.
export function mountVapor(component: Parameters<typeof createVaporApp>[0]) {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createVaporApp(component);
  try {
    app.mount(host);
  } catch (error) {
    app.unmount();
    host.remove();
    throw error;
  }
  return {
    host,
    unmount() {
      try {
        app.unmount();
      } finally {
        host.remove();
      }
    },
  };
}
