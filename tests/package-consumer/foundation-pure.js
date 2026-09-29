import { createVaporApp } from "vue";
import { FoundationHarness } from "@raitosora/semi-validation-foundation";
import "semi-ui-vue/styles/components/space.css";
import "semi-ui-vue/styles/components/grid.css";
import "semi-ui-vue/styles/components/layout.css";
import "semi-ui-vue/styles/components/tooltip.css";
import "semi-ui-vue/styles/components/popover.css";

if (!FoundationHarness.__vapor)
  throw new Error("Expected precompiled Vapor fixture");
createVaporApp(FoundationHarness).mount("#app");
