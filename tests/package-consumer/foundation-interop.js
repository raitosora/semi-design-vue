import { createApp, vaporInteropPlugin } from "vue";
import { FoundationHarness } from "@raitosora/semi-validation-foundation";

if (!FoundationHarness.__vapor)
  throw new Error("Expected precompiled Vapor fixture");
createApp(FoundationHarness).use(vaporInteropPlugin).mount("#app");
