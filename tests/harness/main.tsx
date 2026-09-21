import LocaleDynamic from "../../website/examples/locale/Dynamic.vapor";
import LocaleFallback from "../../website/examples/locale/Fallback.vapor";
import LocaleNested from "../../website/examples/locale/Nested.vapor";
import LocaleDate from "../../website/examples/locale/DateBoundary.vapor";
import ConfigNested from "../../website/examples/configProvider/Nested.vapor";
import ConfigResponsive from "../../website/examples/configProvider/Responsive.vapor";
import ConfigOverlay from "../../website/examples/configProvider/Overlay.vapor";
import VirtualDemo from "../../website/examples/virtualization/Virtual.vapor";
import PointerDemo from "../../website/examples/pointer/Pointer.vapor";
import AnimationDemo from "../../website/examples/animation/Animation.vapor";
import { createVaporApp, defineVaporComponent, ref } from "vue";
import FoundationInput from "../../website/examples/foundation/Input.vapor";
import FoundationTooltip from "../../website/examples/foundation/Tooltip.vapor";
import OverlayDemo from "../../website/examples/overlay/Overlay.vapor";
import DomDemo from "../../website/examples/dom/Dom.vapor";
import ContextDemo from "../../website/examples/context/Context.vapor";
import Contracts from "../../website/examples/contracts/Protocol.vapor";
import Generic from "../../website/examples/contracts/Generic.vapor";
import IconBasic from "../../website/examples/icons/Basic.vapor";
import IconCustomSvg from "../../website/examples/icons/CustomSvg.vapor";
import IconStates from "../../website/examples/icons/States.vapor";
import IconCatalog from "../../website/examples/icons/Catalog.vapor";
import { Lifecycle } from "../fixtures/Lifecycle.vapor";
import "../../packages/semi-ui-vue/dist/styles/components/icons.css";
import "./style.css";

const pulses = ref(0);
const disposals = ref(0);
const visible = ref(true);
const contractsMode = new URLSearchParams(location.search).has("contracts");
const foundationMode = new URLSearchParams(location.search).has("foundation");
const contextMode = new URLSearchParams(location.search).has("context");
const overlayMode = new URLSearchParams(location.search).has("overlay");
const domMode = new URLSearchParams(location.search).has("dom");
const iconsMode = new URLSearchParams(location.search).has("icons");
const app = createVaporApp(
  new URLSearchParams(location.search).has("locale")
    ? defineVaporComponent(() => (
        <main>
          <h1>Locale examples</h1>
          <LocaleDynamic />
          <LocaleFallback />
          <LocaleNested />
          <LocaleDate />
        </main>
      ))
    : new URLSearchParams(location.search).has("configProvider")
      ? defineVaporComponent(() => (
          <main>
            <h1>ConfigProvider examples</h1>
            <ConfigNested />
            <ConfigResponsive />
            <ConfigOverlay />
            <ConfigOverlay />
          </main>
        ))
      : new URLSearchParams(location.search).has("virtual")
        ? VirtualDemo
        : new URLSearchParams(location.search).has("pointer")
          ? PointerDemo
          : new URLSearchParams(location.search).has("animation")
            ? AnimationDemo
            : overlayMode
              ? OverlayDemo
              : domMode
                ? DomDemo
                : contextMode
                  ? ContextDemo
                  : iconsMode
                    ? defineVaporComponent(() => (
                        <main>
                          <h1>Icon examples</h1>
                          <IconBasic />
                          <IconCustomSvg />
                          <IconStates />
                          <IconCatalog />
                        </main>
                      ))
                    : foundationMode
                      ? defineVaporComponent(() => (
                          <main>
                            <FoundationInput />
                            <FoundationTooltip />
                          </main>
                        ))
                      : contractsMode
                        ? defineVaporComponent(() => (
                            <main>
                              <Contracts />
                              <Generic />
                            </main>
                          ))
                        : defineVaporComponent(() => (
                            <main>
                              <h1>Semi Design Vue</h1>
                              <p>Vapor compiler and lifecycle fixture</p>
                              <button
                                onClick={() => {
                                  visible.value = !visible.value;
                                }}
                              >
                                Toggle fixture
                              </button>
                              <Lifecycle
                                v-if={visible.value}
                                label="Lifecycle fixture"
                                onDispose={() => {
                                  disposals.value += 1;
                                }}
                                onPulse={() => {
                                  pulses.value += 1;
                                }}
                              />
                              <output aria-label="Lifecycle totals">
                                Pulses {pulses.value} / Disposals{" "}
                                {disposals.value}
                              </output>
                            </main>
                          )),
);
app.mount("#app");
declare global {
  interface Window {
    unmountFixture: () => void;
  }
}
window.unmountFixture = () => app.unmount();
if (import.meta.hot) import.meta.hot.dispose(() => app.unmount());
