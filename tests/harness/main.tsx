import "../../packages/semi-ui-vue/dist/styles/components/card.css";
import CardBasic from "../../website/examples/card/Basic.vapor";
import CardDynamic from "../../website/examples/card/Dynamic.vapor";
import CardGroupDemo from "../../website/examples/card/Group.vapor";
import CardTheme from "../../website/examples/card/Theme.vapor";
import "../../packages/semi-ui-vue/dist/styles/components/empty.css";
import EmptyBasic from "../../website/examples/empty/Basic.vapor";
import EmptyDynamic from "../../website/examples/empty/Dynamic.vapor";
import EmptyTheme from "../../website/examples/empty/Theme.vapor";
import "../../packages/semi-ui-vue/dist/styles/components/typography.css";
import TypographyBasic from "../../website/examples/typography/Basic.vapor";
import TypographyInteractive from "../../website/examples/typography/Interactive.vapor";
import TypographyNumeral from "../../website/examples/typography/Numeral.vapor";
import TypographyTheme from "../../website/examples/typography/Theme.vapor";
import BadgeBasic from "../../website/examples/badge/Basic.vapor";
import BadgeDynamic from "../../website/examples/badge/Dynamic.vapor";
import BadgeTheme from "../../website/examples/badge/Theme.vapor";
import TagBasic from "../../website/examples/tag/Basic.vapor";
import TagInteraction from "../../website/examples/tag/Interaction.vapor";
import TagGroups from "../../website/examples/tag/Groups.vapor";
import TagTheme from "../../website/examples/tag/Theme.vapor";
import AvatarBasic from "../../website/examples/avatar/Basic.vapor";
import AvatarMeasure from "../../website/examples/avatar/Measure.vapor";
import AvatarDecoration from "../../website/examples/avatar/Decoration.vapor";
import AvatarGroup from "../../website/examples/avatar/Group.vapor";
import AvatarTheme from "../../website/examples/avatar/Theme.vapor";
import OverflowListBasic from "../../website/examples/overflowList/Basic.vapor";
import OverflowListDynamic from "../../website/examples/overflowList/Dynamic.vapor";
import OverflowListScroll from "../../website/examples/overflowList/Scroll.vapor";
import OverflowListTheme from "../../website/examples/overflowList/Theme.vapor";
import CollapsibleBasic from "../../website/examples/collapsible/Basic.vapor";
import CollapsibleDynamic from "../../website/examples/collapsible/Dynamic.vapor";
import CollapsibleRetention from "../../website/examples/collapsible/Retention.vapor";
import CollapsibleTheme from "../../website/examples/collapsible/Theme.vapor";
import PopoverBasic from "../../website/examples/popover/Basic.vapor";
import PopoverTriggers from "../../website/examples/popover/Triggers.vapor";
import PopoverAdvanced from "../../website/examples/popover/Advanced.vapor";
import PopoverTheme from "../../website/examples/popover/Theme.vapor";
import TooltipBasic from "../../website/examples/tooltip/Basic.vapor";
import TooltipTriggers from "../../website/examples/tooltip/Triggers.vapor";
import TooltipAdvanced from "../../website/examples/tooltip/Advanced.vapor";
import TooltipTheme from "../../website/examples/tooltip/Theme.vapor";
import ProgressBasic from "../../website/examples/progress/Basic.vapor";
import ProgressDynamic from "../../website/examples/progress/Dynamic.vapor";
import ProgressFormat from "../../website/examples/progress/Format.vapor";
import ProgressTheme from "../../website/examples/progress/Theme.vapor";
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
import HighlightBasic from "../../website/examples/highlight/Basic.vapor";
import HighlightCustom from "../../website/examples/highlight/Custom.vapor";
import HighlightDynamic from "../../website/examples/highlight/Dynamic.vapor";
import HighlightTheme from "../../website/examples/highlight/Theme.vapor";
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
import "../../packages/semi-ui-vue/dist/styles/components/highlight.css";
import "../../packages/semi-ui-vue/dist/styles/components/progress.css";
import "../../packages/semi-ui-vue/dist/styles/components/tooltip.css";
import "../../packages/semi-ui-vue/dist/styles/components/popover.css";
import "../../packages/semi-ui-vue/dist/styles/components/collapsible.css";
import "../../packages/semi-ui-vue/dist/styles/components/overflowList.css";
import "../../packages/semi-ui-vue/dist/styles/components/avatar.css";
import "../../packages/semi-ui-vue/dist/styles/components/tag.css";
import "../../packages/semi-ui-vue/dist/styles/components/badge.css";
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
const cardMode = new URLSearchParams(location.search).has("card");
const emptyMode = new URLSearchParams(location.search).has("empty");
const typographyMode = new URLSearchParams(location.search).has("typography");
const badgeMode = new URLSearchParams(location.search).has("badge");
const tagMode = new URLSearchParams(location.search).has("tag");
const avatarMode = new URLSearchParams(location.search).has("avatar");
const overflowListMode = new URLSearchParams(location.search).has(
  "overflowList",
);
const collapsibleMode = new URLSearchParams(location.search).has("collapsible");
const popoverMode = new URLSearchParams(location.search).has("popover");
const tooltipMode = new URLSearchParams(location.search).has("tooltip");
const progressMode = new URLSearchParams(location.search).has("progress");
const highlightMode = new URLSearchParams(location.search).has("highlight");
const app = createVaporApp(
  spaceMode ||
    gridMode ||
    layoutMode ||
    skeletonMode ||
    highlightMode ||
    progressMode ||
    tooltipMode ||
    popoverMode ||
    collapsibleMode ||
    overflowListMode ||
    avatarMode ||
    tagMode ||
    badgeMode ||
    typographyMode ||
    emptyMode ||
    cardMode
    ? defineVaporComponent(() => (
        <main>
          {cardMode ? (
            <>
              <h1>Card examples</h1>
              <CardBasic />
              <CardDynamic />
              <CardGroupDemo />
              <CardTheme />
            </>
          ) : emptyMode ? (
            <>
              <h1>Empty examples</h1>
              <EmptyBasic />
              <EmptyDynamic />
              <EmptyTheme />
            </>
          ) : typographyMode ? (
            <>
              <h1 id="typography-target">Typography examples</h1>
              <TypographyBasic />
              <TypographyInteractive />
              <TypographyNumeral />
              <TypographyTheme />
            </>
          ) : badgeMode ? (
            <>
              <h1>Badge examples</h1>
              <BadgeBasic />
              <BadgeDynamic />
              <BadgeTheme />
            </>
          ) : tagMode ? (
            <>
              <h1>Tag examples</h1>
              <TagBasic />
              <TagInteraction />
              <TagGroups />
              <TagTheme />
            </>
          ) : avatarMode ? (
            <>
              <h1>Avatar examples</h1>
              <AvatarBasic />
              <AvatarMeasure />
              <AvatarDecoration />
              <AvatarGroup />
              <AvatarTheme />
            </>
          ) : overflowListMode ? (
            <>
              <h1>OverflowList examples</h1>
              <OverflowListBasic />
              <OverflowListDynamic />
              <OverflowListScroll />
              <OverflowListTheme />
            </>
          ) : collapsibleMode ? (
            <>
              <h1>Collapsible examples</h1>
              <CollapsibleBasic />
              <CollapsibleDynamic />
              <CollapsibleRetention />
              <CollapsibleTheme />
            </>
          ) : popoverMode ? (
            <>
              <h1>Popover examples</h1>
              <PopoverBasic />
              <PopoverTriggers />
              <PopoverAdvanced />
              <PopoverTheme />
            </>
          ) : tooltipMode ? (
            <>
              <h1>Tooltip examples</h1>
              <TooltipBasic />
              <TooltipTriggers />
              <TooltipAdvanced />
              <TooltipTheme />
            </>
          ) : progressMode ? (
            <>
              <h1>Progress examples</h1>
              <ProgressBasic />
              <ProgressDynamic />
              <ProgressFormat />
              <ProgressTheme />
            </>
          ) : highlightMode ? (
            <>
              <h1>Highlight examples</h1>
              <HighlightBasic />
              <HighlightCustom />
              <HighlightDynamic />
              <HighlightTheme />
            </>
          ) : skeletonMode ? (
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
