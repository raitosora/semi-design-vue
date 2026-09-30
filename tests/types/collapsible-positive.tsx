import type { JSX } from "vue-jsx";
import {
  Collapsible as Root,
  type CollapsibleProps,
} from "../../packages/semi-ui-vue/src/index.js";
import Collapsible, {
  type CollapsibleSlots,
} from "../../packages/semi-ui-vue/src/components/collapsible/index.js";
import { semiGlobal } from "../../packages/semi-ui-vue/src/context/index.js";
const same: typeof Root = Collapsible;
const props: CollapsibleProps = {
  isOpen: undefined,
  motion: false,
  duration: 0,
  collapseHeight: 10,
  collapseHeightAdaptive: true,
  fade: true,
  keepDOM: true,
  lazyRender: true,
  reCalcKey: "content",
  id: "panel",
  className: "legacy",
  style: [{ color: "red" }, { height: "10px" }],
  onMotionEnd: () => {},
  "aria-label": "Owned content",
};
const slots: CollapsibleSlots = {
  default: () => (
    <>
      <span>One</span>
      <span>Two</span>
    </>
  ),
};
const fixture: JSX.Element = <Collapsible {...props} v-slots={slots} />;
semiGlobal.configure({
  overrideDefaultProps: { Collapsible: { isOpen: true, keepDOM: true } },
});
const info: { isShown: boolean; height: number } = Collapsible.getEntryInfo(
  {} as ResizeObserverEntry,
);
const name: "Collapsible" = Collapsible.__SemiComponentName__;
void [same, fixture, info, name];
