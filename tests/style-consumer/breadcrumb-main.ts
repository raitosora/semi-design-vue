import "semi-ui-vue/styles/base.css";
import "semi-ui-vue/styles/components/breadcrumb.css";
import "./breadcrumb-only.scss";
import "virtual:semi-theme.scss";
import "virtual:semi-theme.css";
import {
  createComponent,
  createVaporApp,
  defineVaporComponent,
  nextTick,
  ref,
} from "vue";
import Breadcrumb, { type RouteProps } from "semi-ui-vue/breadcrumb";
import { provideAriaIdScope } from "semi-ui-vue";
import { breadcrumbMarkup } from "./breadcrumb-markup";

document.body.innerHTML = ["semi", "consumer", "theme"]
  .map(breadcrumbMarkup)
  .join("");
const host = document.createElement("div");
host.dataset.breadcrumbRuntimeHost = "";
host.style.padding = "12px";
document.body.append(host);
const updated = ref(false);
let popupClickEvents: string[] = [];
let popupItemEvent: MouseEvent | undefined;
const recordPopupClick = (
  phase: "own" | "parent",
  route: RouteProps,
  event: MouseEvent,
) => {
  if (phase === "own") popupItemEvent = event;
  const collapsed = Boolean(
    document.querySelector(
      "[data-breadcrumb-popup-click] .semi-breadcrumb-collapse",
    ),
  );
  popupClickEvents = [
    ...popupClickEvents,
    `${phase}:${route.name}:${collapsed ? "collapsed" : "expanded"}:${event === popupItemEvent ? "same-event" : "different-event"}`,
  ];
};
const app = createVaporApp(
  defineVaporComponent(() => {
    provideAriaIdScope("style-breadcrumb-consumer");
    return [
      createComponent(Breadcrumb, {
        compact: () => !updated.value,
        separator: () => (updated.value ? ">" : "/"),
        maxItemCount: () => 3,
        routes: () => [
          { key: "home", name: "Home", href: "#runtime-home" },
          { key: "one", name: "Folder one" },
          { key: "two", name: "Folder two" },
          { key: "three", name: "Folder three" },
          {
            key: "current",
            name: updated.value
              ? "Updated long current breadcrumb title that should truncate"
              : "Current",
          },
        ],
        "data-breadcrumb-runtime": () => "",
      }),
      createComponent(Breadcrumb, {
        moreType: () => "popover",
        maxItemCount: () => 3,
        routes: () => [
          "Popover Home",
          "Hidden folder one",
          "Hidden folder two",
          "Visible folder",
          "Popover Current",
        ],
        "data-breadcrumb-popover": () => "",
      }),
      createComponent(Breadcrumb, {
        moreType: () => "popover",
        maxItemCount: () => 3,
        onClick: () => (route: RouteProps, event: MouseEvent) =>
          recordPopupClick("parent", route, event),
        routes: () => [
          { key: "click-home", name: "Click Home" },
          {
            key: "click-hidden",
            name: "Click hidden folder",
            onClick: (route: RouteProps, event: MouseEvent) =>
              recordPopupClick("own", route, event),
          },
          { key: "click-other", name: "Click other hidden folder" },
          { key: "click-visible", name: "Click visible folder" },
          { key: "click-current", name: "Click Current" },
        ],
        "data-breadcrumb-popup-click": () => "",
      }),
    ];
  }),
);
app.mount(host);
declare global {
  interface Window {
    breadcrumbStyleUpdate(): Promise<void>;
    breadcrumbStylePopupClickEvents(): readonly string[];
    breadcrumbStyleUnmount(): void;
  }
}
window.breadcrumbStylePopupClickEvents = () => [...popupClickEvents];
window.breadcrumbStyleUpdate = async () => {
  updated.value = true;
  await nextTick();
};
window.breadcrumbStyleUnmount = () => {
  app.unmount();
  if (host.childNodes.length !== 0)
    throw new Error("Breadcrumb runtime retained DOM after unmount");
  host.remove();
};
