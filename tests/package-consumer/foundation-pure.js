import "semi-ui-vue/styles/components/badge.css";
import "semi-ui-vue/styles/components/tag.css";
import "semi-ui-vue/styles/components/avatar.css";
import { createVaporApp } from "vue";
import { FoundationHarness } from "@raitosora/semi-validation-foundation";
import "semi-ui-vue/styles/components/space.css";
import "semi-ui-vue/styles/components/grid.css";
import "semi-ui-vue/styles/components/layout.css";
import "semi-ui-vue/styles/components/tooltip.css";
import "semi-ui-vue/styles/components/popover.css";
import "semi-ui-vue/styles/components/overflowList.css";

if (!FoundationHarness.__vapor)
  throw new Error("Expected precompiled Vapor fixture");
const app = createVaporApp(FoundationHarness);
app.mount("#app");
window.unmountFoundation = () => app.unmount();
