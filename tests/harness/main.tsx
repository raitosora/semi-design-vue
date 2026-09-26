import IconButtonBasic from "../../website/examples/iconButton/Basic.vapor";
import IconButtonPosition from "../../website/examples/iconButton/Position.vapor";
import IconButtonDynamic from "../../website/examples/iconButton/Dynamic.vapor";
import IconButtonStyle from "../../website/examples/iconButton/Style.vapor";
import DividerBasic from "../../website/examples/divider/Basic.vapor";
import DividerContent from "../../website/examples/divider/Content.vapor";
import DividerTheme from "../../website/examples/divider/Theme.vapor";
import SpaceBasic from "../../website/examples/space/Basic.vapor";
import SpaceDynamic from "../../website/examples/space/Dynamic.vapor";
import SpaceResponsive from "../../website/examples/space/Responsive.vapor";
import GridBasic from "../../website/examples/grid/Basic.vapor";
import GridResponsive from "../../website/examples/grid/Responsive.vapor";
import GridDynamic from "../../website/examples/grid/Dynamic.vapor";
import LayoutBasic from "../../website/examples/layout/Basic.vapor";
import LayoutDynamic from "../../website/examples/layout/Dynamic.vapor";
import LayoutBreakpoint from "../../website/examples/layout/Breakpoint.vapor";
import SkeletonBasic from "../../website/examples/skeleton/Basic.vapor";
import SkeletonDynamic from "../../website/examples/skeleton/Dynamic.vapor";
import SkeletonTheme from "../../website/examples/skeleton/Theme.vapor";
import ButtonBasic from "../../website/examples/button/Basic.vapor";
import ButtonStateForm from "../../website/examples/button/StateForm.vapor";
import ButtonGroups from "../../website/examples/button/Groups.vapor";
import LocaleDynamic from "../../website/examples/locale/Dynamic.vapor";
import LocaleFallback from "../../website/examples/locale/Fallback.vapor";
import LocaleNested from "../../website/examples/locale/Nested.vapor";
import LocaleDate from "../../website/examples/locale/DateBoundary.vapor";
import SpinBasic from "../../website/examples/spin/Basic.vapor";
import SpinDynamic from "../../website/examples/spin/Dynamic.vapor";
import SpinCustom from "../../website/examples/spin/Custom.vapor";
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
import "../../packages/semi-ui-vue/dist/styles/base.css";
import "../../packages/semi-ui-vue/dist/styles/components/icons.css";
import "../../packages/semi-ui-vue/dist/styles/components/spin.css";
import "../../packages/semi-ui-vue/dist/styles/components/iconButton.css";
import "../../packages/semi-ui-vue/dist/styles/components/button.css";
import "../../packages/semi-ui-vue/dist/styles/components/divider.css";
import "../../packages/semi-ui-vue/dist/styles/components/space.css";
import "../../packages/semi-ui-vue/dist/styles/components/grid.css";
import "../../packages/semi-ui-vue/dist/styles/components/layout.css";
import "../../packages/semi-ui-vue/dist/styles/components/skeleton.css";
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
const spaceMode = new URLSearchParams(location.search).has("space");
const gridMode = new URLSearchParams(location.search).has("grid");
const layoutMode = new URLSearchParams(location.search).has("layout");
const skeletonMode = new URLSearchParams(location.search).has("skeleton");
const app = createVaporApp(
  spaceMode || gridMode || layoutMode || skeletonMode
    ? defineVaporComponent(() => (
        <main>
          {skeletonMode ? (
            <>
              <h1>Skeleton examples</h1>
              <SkeletonBasic />
              <SkeletonDynamic />
              <SkeletonTheme />
            </>
          ) : layoutMode ? (
            <>
              <h1>Layout examples</h1>
              <LayoutBasic />
              <LayoutDynamic />
              <LayoutBreakpoint />
            </>
          ) : gridMode ? (
            <>
              <h1>Grid examples</h1>
              <GridBasic />
              <GridResponsive />
              <GridDynamic />
            </>
          ) : (
            <>
              <h1>Space examples</h1>
              <SpaceBasic />
              <SpaceDynamic />
              <SpaceResponsive />
            </>
          )}
        </main>
      ))
    : new URLSearchParams(location.search).has("divider")
      ? defineVaporComponent(() => (
          <main>
            <h1>Divider examples</h1>
            <DividerBasic />
            <DividerContent />
            <DividerTheme />
          </main>
        ))
      : new URLSearchParams(location.search).has("iconButton")
        ? defineVaporComponent(() => (
            <main>
              <h1>IconButton examples</h1>
              <IconButtonBasic />
              <IconButtonPosition />
              <IconButtonDynamic />
              <IconButtonStyle />
            </main>
          ))
        : new URLSearchParams(location.search).has("button")
          ? defineVaporComponent(() => (
              <main>
                <h1>Button examples</h1>
                <ButtonBasic />
                <ButtonStateForm />
                <ButtonGroups />
              </main>
            ))
          : new URLSearchParams(location.search).has("spin")
            ? defineVaporComponent(() => (
                <main>
                  <h1>Spin examples</h1>
                  <SpinBasic />
                  <SpinDynamic />
                  <SpinCustom />
                </main>
              ))
            : new URLSearchParams(location.search).has("locale")
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
                                        <p>
                                          Vapor compiler and lifecycle fixture
                                        </p>
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
