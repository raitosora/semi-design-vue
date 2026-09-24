import { createApp, vaporInteropPlugin } from "vue";
import { FoundationHarness } from "@raitosora/semi-validation-foundation";
import "semi-ui-vue/styles/components/space.css";

if (!FoundationHarness.__vapor)
  throw new Error("Expected precompiled Vapor fixture");
createApp(FoundationHarness).use(vaporInteropPlugin).mount("#app");
