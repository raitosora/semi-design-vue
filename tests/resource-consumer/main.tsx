import { checkTypographyConsumer } from "./typography.js";
import { checkBadgeConsumer } from "./badge.js";
import { checkTagConsumer } from "./tag.js";
import "semi-ui-vue/styles/base.css";
import { checkAvatarConsumer } from "./avatar.js";
import { checkDividerConsumer } from "./divider.js";
import { checkSpaceConsumer } from "./space.js";
import { checkGridConsumer } from "./grid.js";
import { checkLayoutConsumer } from "./layout.js";
import { checkOverflowListConsumer } from "./overflowList.js";
import { checkCollapsibleConsumer } from "./collapsible.js";
import { checkPopoverConsumer } from "./popover.js";
import { checkTooltipConsumer } from "./tooltip.js";
import { checkProgressConsumer } from "./progress.js";
import { checkHighlightConsumer } from "./highlight.js";
import { checkSkeletonConsumer } from "./skeleton.js";
import { checkIconButtonConsumer } from "./iconButton.js";
import { checkButtonConsumer } from "./button.js";
import { checkSpinConsumer } from "./spin.js";
import { checkLocaleConsumer } from "./locale.js";
import { checkConfigProviderConsumer } from "./configProvider.js";
import { checkContextConsumer } from "./context.js";
import { checkDomConsumer } from "./dom.js";
import { checkOverlayConsumer } from "./overlay.js";
import { checkAnimationConsumer } from "./animation.js";
import { mountVirtualPointerConsumer } from "./virtual-pointer.js";
import { createVaporApp, defineVaporComponent, ref } from "vue";
import IconAIFileLevel3, {
  IconAIFileLevel3 as NamedIconAIFileLevel3,
} from "semi-icons-vue/IconAIFileLevel3";
import IconHome from "semi-icons-vue/IconHome";
import {
  default as Icon,
  convertIcon,
  Icon as NamedIcon,
  IconHome as RootIconHome,
  type IconHandle,
  type IconSize,
  version as iconsVersion,
} from "semi-icons-vue";
import IconFromSubpath, {
  Icon as NamedIconFromSubpath,
} from "semi-icons-vue/Icon";
import { Icon as UiIcon } from "semi-ui-vue";
import UiIconFromSubpath, {
  Icon as NamedUiIconFromSubpath,
} from "semi-ui-vue/icons";
import "semi-ui-vue/styles/components/icons.css";
import { version as labVersion } from "semi-icons-lab-vue";
import { version as illustrationsVersion } from "semi-illustrations-vue";
import IconForm, {
  IconForm as NamedIconForm,
} from "semi-icons-lab-vue/IconForm";
import IllustrationNoContent, {
  IllustrationNoContent as NamedIllustrationNoContent,
} from "semi-illustrations-vue/IllustrationNoContent";
import en_US from "semi-ui-vue/locale/source/en_US";
import zh_CN from "semi-ui-vue/locale/source/zh_CN";
import type { Locale } from "semi-ui-vue/locale/interface";

declare global {
  interface Window {
    resourceConsumer: {
      checkIconButton(): Promise<string>;
      checkButton(): Promise<string>;
      checkDivider(): Promise<string>;
      checkSpace(): Promise<string>;
      checkGrid(): Promise<string>;
      checkLayout(): Promise<string>;
      checkSkeleton(): Promise<string>;
      checkHighlight(): Promise<string>;
      checkTypography(): Promise<string>;
      checkBadge(): Promise<string>;
      checkTag(): Promise<string>;
      checkAvatar(): Promise<string>;
      checkOverflowList(): Promise<string>;
      checkCollapsible(): Promise<string>;
      checkPopover(): Promise<string>;
      checkTooltip(): Promise<string>;
      checkProgress(): Promise<string>;
      checkSpin(): Promise<string>;
      checkLocale(): Promise<string>;
      checkConfigProvider(): Promise<string>;
      checkContext(): Promise<string>;
      checkDom(): Promise<string>;
      checkOverlay(): Promise<string>;
      checkAnimation(): Promise<string>;
      checkVirtualPointer(): Promise<string>;
      en_US: Locale;
      zh_CN: Locale;
      setHomeColor(color: string): void;
      updateIcon(
        color: string,
        fill: readonly string[],
        size: IconSize,
        rotate: number,
      ): void;
      getIconElement(): HTMLSpanElement | null;
      unmount(): void;
    };
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

for (const version of [iconsVersion, labVersion, illustrationsVersion])
  assert(
    version === "0.0.0",
    "Resource package version export must remain available",
  );

const locale: Locale = en_US;
const homeColor = ref("rgb(12, 90, 190)");
const iconColor = ref("rgb(70, 107, 255)");
const iconFill = ref<readonly string[]>(["#465fff", "#9caeff"]);
const iconSize = ref<IconSize>("inherit");
const iconRotate = ref(90);
const generatedIconHandle = ref<IconHandle | null>(null);
const FactoryIcon = convertIcon(
  (scope) => (
    <svg
      data-icon-id={scope.id}
      height={scope.size}
      viewBox="0 0 8 8"
      width={scope.size}
    >
      <path d="M1 1h6v6H1z" fill={scope.fill?.[0] ?? "currentColor"} />
    </svg>
  ),
  "factory",
);
assert(en_US.dateFnsLocale.localize, "English date-fns localize is missing");
assert(zh_CN.dateFnsLocale.localize, "Chinese date-fns localize is missing");
assert(locale.code === "en-US", "English locale did not retain its code");
assert(
  en_US.dateFnsLocale.localize.month(0, { width: "wide" }) === "January",
  "English date-fns locale is not functional",
);
assert(
  zh_CN.dateFnsLocale.localize.month(0, { width: "wide" }) === "一月",
  "Chinese date-fns locale is not functional",
);
assert(
  IconAIFileLevel3 === NamedIconAIFileLevel3,
  "Icon subpath exports disagree",
);
assert(IconHome === RootIconHome, "Root and subpath icon exports disagree");
assert(Icon === NamedIcon, "Icon root default and named exports disagree");
assert(Icon.elementType === "Icon", "Icon elementType marker is unavailable");
assert(
  FactoryIcon.elementType === "Icon",
  "convertIcon did not retain the Icon elementType marker",
);
assert(
  Icon === IconFromSubpath,
  "Icon root and subpath default exports disagree",
);
assert(
  Icon === NamedIconFromSubpath,
  "Icon subpath default and named exports disagree",
);
assert(
  Icon === UiIcon,
  "UI root Icon does not re-export the icons package Icon",
);
assert(Icon === UiIconFromSubpath, "UI icons default does not re-export Icon");
assert(
  Icon === NamedUiIconFromSubpath,
  "UI icons named export does not re-export Icon",
);
assert(IconForm === NamedIconForm, "Lab icon subpath exports disagree");
assert(
  IllustrationNoContent === NamedIllustrationNoContent,
  "Illustration subpath exports disagree",
);

const ResourceView = defineVaporComponent<{ label: string }>(
  (props) => (
    <section aria-label={props.label} class="resource-app">
      <IconHome
        aria-label={`${props.label} recolorable icon`}
        class="recolorable-icon"
        color={homeColor.value}
        size="large"
      />
      <Icon
        aria-label={`${props.label} wrapped generated icon`}
        className="wrapped-generated-icon"
        color={iconColor.value}
        prefixCls="semi"
        ref={generatedIconHandle}
        rotate={iconRotate.value}
        size={iconSize.value}
        spin={true}
        style={{ fontSize: iconSize.value === "inherit" ? "31px" : undefined }}
        type="primary"
        v-slots={{
          svg: () => <IconHome aria-hidden="true" size="inherit" />,
        }}
      />
      <Icon
        className="slot-priority-icon"
        prefixCls="consumer"
        v-slots={{
          default: () => <svg data-slot="default" viewBox="0 0 1 1" />,
          svg: () => <svg data-slot="svg" viewBox="0 0 1 1" />,
        }}
      />
      <Icon
        aria-hidden={false}
        className="aria-override-icon"
        prefixCls="consumer"
        role="presentation"
        v-slots={{
          svg: () => <svg data-slot="aria-override" viewBox="0 0 1 1" />,
        }}
      />
      <Icon
        className="decorative-icon"
        data-icon-contract="decorative"
        prefixCls="consumer"
        type="warning"
        v-slots={{
          default: (scope) => (
            <svg
              aria-hidden="true"
              data-fill={scope.fill?.join(",")}
              data-icon-id={scope.id}
              height={scope.size}
              viewBox="0 0 8 8"
              width={scope.size}
            >
              <path d="M1 1h6v6H1z" fill="currentColor" />
            </svg>
          ),
        }}
      />
      <Icon
        aria-labelledby={`${props.label}-custom-title`}
        className="custom-slot-icon"
        color={iconColor.value}
        fill={iconFill.value}
        prefixCls="consumer"
        v-slots={{
          svg: (scope) => (
            <svg
              data-fill={scope.fill?.join(",")}
              data-icon-id={scope.id}
              height={scope.size}
              viewBox="0 0 12 12"
              width={scope.size}
            >
              <title id={`${props.label}-custom-title`}>
                Custom consumer icon
              </title>
              <defs>
                <linearGradient id={`${scope.id}-gradient`}>
                  <stop
                    offset="0"
                    stop-color={scope.fill?.[0] ?? "currentColor"}
                  />
                  <stop
                    offset="1"
                    stop-color={scope.fill?.[1] ?? "currentColor"}
                  />
                </linearGradient>
              </defs>
              <path d="M1 1h10v10H1z" fill={`url(#${scope.id}-gradient)`} />
            </svg>
          ),
        }}
      />
      <FactoryIcon
        aria-label={`${props.label} factory icon`}
        className="factory-icon"
        fill={iconFill.value}
        prefixCls="semi"
      />
      <IconAIFileLevel3
        aria-label={`${props.label} gradient icon`}
        class="gradient-icon"
        color="rgb(12, 90, 190)"
        size="large"
      />
      <IconForm
        aria-label={`${props.label} clipped icon`}
        class="clipped-icon"
        color="#d04a28"
        size={40}
      />
      <IllustrationNoContent
        aria-label={`${props.label} illustration`}
        class="illustration"
        color="#1f8f63"
        size="120"
      />
      <output class="locale-output">
        {`${en_US.Pagination.pageSize} | ${zh_CN.Pagination.pageSize}`}
      </output>
    </section>
  ),
  { props: ["label"] },
);

function mount(label: string) {
  const host = document.createElement("div");
  host.dataset.resourceMount = label;
  document.querySelector("#resource-consumer")?.append(host);
  const app = createVaporApp(() => <ResourceView label={label} />);
  app.mount(host);
  return { app, host };
}

const first = mount("first");
const second = mount("second");
first.app.unmount();
first.host.remove();
const remounted = mount("remounted");
const virtualPointer = mountVirtualPointerConsumer();

window.resourceConsumer = {
  checkIconButton: checkIconButtonConsumer,
  checkButton: checkButtonConsumer,
  checkDivider: checkDividerConsumer,
  checkSpace: checkSpaceConsumer,
  checkGrid: checkGridConsumer,
  checkLayout: checkLayoutConsumer,
  checkSkeleton: checkSkeletonConsumer,
  checkHighlight: checkHighlightConsumer,
  checkTooltip: checkTooltipConsumer,
  checkTypography: checkTypographyConsumer,
  checkBadge: checkBadgeConsumer,
  checkTag: checkTagConsumer,
  checkAvatar: checkAvatarConsumer,
  checkOverflowList: checkOverflowListConsumer,
  checkCollapsible: checkCollapsibleConsumer,
  checkPopover: checkPopoverConsumer,
  checkProgress: checkProgressConsumer,
  checkSpin: checkSpinConsumer,
  checkLocale: checkLocaleConsumer,
  checkConfigProvider: checkConfigProviderConsumer,
  checkContext: checkContextConsumer,
  checkDom: checkDomConsumer,
  checkOverlay: checkOverlayConsumer,
  checkAnimation: checkAnimationConsumer,
  checkVirtualPointer: virtualPointer.check,
  en_US,
  zh_CN,
  setHomeColor(color) {
    homeColor.value = color;
  },
  updateIcon(color, fill, size, rotate) {
    iconColor.value = color;
    iconFill.value = fill;
    iconSize.value = size;
    iconRotate.value = rotate;
  },
  getIconElement() {
    return generatedIconHandle.value?.getElement() ?? null;
  },
  unmount() {
    second.app.unmount();
    remounted.app.unmount();
    virtualPointer.unmount();
    second.host.remove();
    remounted.host.remove();
  },
};

// @ts-expect-error Resource size accepts the documented string/number forms only.
const invalidSize = () => <IconAIFileLevel3 size={false} />;
void invalidSize;
