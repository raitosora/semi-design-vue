import { checkContextConsumer } from "./context.js";
import { checkDomConsumer } from "./dom.js";
import { checkOverlayConsumer } from "./overlay.js";
import { createVaporApp, defineVaporComponent, ref } from "vue";
import IconAIFileLevel3, {
  IconAIFileLevel3 as NamedIconAIFileLevel3,
} from "semi-icons-vue/IconAIFileLevel3";
import IconHome from "semi-icons-vue/IconHome";
import {
  IconHome as RootIconHome,
  version as iconsVersion,
} from "semi-icons-vue";
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
      checkContext(): Promise<string>;
      checkDom(): Promise<string>;
      checkOverlay(): Promise<string>;
      en_US: Locale;
      zh_CN: Locale;
      setHomeColor(color: string): void;
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

window.resourceConsumer = {
  checkContext: checkContextConsumer,
  checkDom: checkDomConsumer,
  checkOverlay: checkOverlayConsumer,
  en_US,
  zh_CN,
  setHomeColor(color) {
    homeColor.value = color;
  },
  unmount() {
    second.app.unmount();
    remounted.app.unmount();
    second.host.remove();
    remounted.host.remove();
  },
};

// @ts-expect-error Resource size accepts the documented string/number forms only.
const invalidSize = () => <IconAIFileLevel3 size={false} />;
void invalidSize;
