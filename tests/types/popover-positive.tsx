import { ref } from "vue";
import {
  Popover,
  type PopoverState,
} from "../../packages/semi-ui-vue/src/index";
import SubpathPopover, {
  type PopoverProps,
  type PopoverSlots,
  type PopoverInstance,
  type ArrowProps,
  type ArrowBounding,
  type Position,
  type Trigger,
  type RenderContent,
  type RenderContentProps,
  type PopoverTriggerProps,
  type PopoverTriggerScope,
} from "../../packages/semi-ui-vue/src/components/popover/index";
const position: Position = "rightBottomOver";
const trigger: Trigger = "contextMenu";
const bounds: ArrowBounding = { width: 24, height: 8, offsetX: 0, offsetY: 6 };
const style: NonNullable<PopoverProps["arrowStyle"]> = {
  borderColor: "red",
  backgroundColor: "blue",
  borderOpacity: 0,
};
const arrow: ArrowProps = {
  position,
  popStyle: { borderColor: "black" },
  arrowStyle: style,
};
const state: PopoverState = { popConfirmVisible: false };
const content: RenderContent = (scope: RenderContentProps) => {
  void scope.initialFocusRef;
  return 0;
};
const props: PopoverProps = {
  trigger,
  position,
  content,
  visible: undefined,
  condition: false,
  spacing: { x: 0, y: 4 },
  margin: { marginTop: 0, marginRight: 1, marginBottom: 2, marginLeft: 3 },
  arrowBounding: bounds,
  arrowStyle: style,
  contentClassName: ["one", { two: true }, ["three"]],
  stopPropagation: "truthy",
  class: { active: true },
  onClickOutSide: (event) => void event.pointerType,
  onEscKeyDown: (event) => event.preventDefault(),
  afterClose: () => undefined,
};
const triggerProps: PopoverTriggerProps = {
  tabIndex: 0,
  "data-popupid": "typed",
  onClick: (event) => void event.clientX,
};
const slots: PopoverSlots = {
  default: (scope: PopoverTriggerScope) => (
    <button
      {...scope.attrs}
      {...scope.triggerProps}
      ref={scope.getTriggerRef("stable")}
    >
      trigger
    </button>
  ),
  content: (scope) => <input ref={scope.initialFocusRef} />,
};
const api = ref<PopoverInstance | null>(null);
const element = (
  <>
    <Popover {...props} ref={api} v-slots={slots} />
    <SubpathPopover content={false} v-slots={slots} />
  </>
);
api.value?.focusTrigger();
void [arrow, state, triggerProps, element];
