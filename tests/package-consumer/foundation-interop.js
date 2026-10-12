import "semi-ui-vue/styles/components/list.css";
import "semi-ui-vue/styles/components/card.css";
import "semi-ui-vue/styles/components/empty.css";
import "semi-ui-vue/styles/components/typography.css";
import "semi-ui-vue/styles/components/badge.css";
import "semi-ui-vue/styles/components/tag.css";
import "semi-ui-vue/styles/components/avatar.css";
import { createApp, vaporInteropPlugin } from "vue";
import { FoundationHarness } from "@raitosora/semi-validation-foundation";
import "semi-ui-vue/styles/components/space.css";
import "semi-ui-vue/styles/components/grid.css";
import "semi-ui-vue/styles/components/layout.css";
import "semi-ui-vue/styles/components/tooltip.css";
import "semi-ui-vue/styles/components/popover.css";
import "semi-ui-vue/styles/components/overflowList.css";

if (!FoundationHarness.__vapor)
  throw new Error("Expected precompiled Vapor fixture");
const app = createApp(FoundationHarness).use(vaporInteropPlugin);
app.mount("#app");
window.unmountFoundation = () => app.unmount();
