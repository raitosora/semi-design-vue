import { ref } from "vue";
import { Tooltip } from "../../packages/semi-ui-vue/src/index";
import SubpathTooltip, {
  type TooltipProps,
  type TooltipSlots,
  type TooltipInstance,
  type Trigger,
  type Position,
  type ArrowBounding,
  type RenderContent,
  type RenderContentProps,
  type TooltipTriggerScope,
  type TooltipTriggerProps,
} from "../../packages/semi-ui-vue/src/components/tooltip/index";
const businessClick = (event: MouseEvent) => void event.button;
const composeClick = (scope: TooltipTriggerScope, event: MouseEvent) => {
  scope.triggerProps.onClick?.(event);
  businessClick(event);
};
const triggerProps: TooltipTriggerProps = {
  tabIndex: 0,
  "data-popupid": "typed-tooltip-popup",
  onClick: (event) => void event.button,
  onFocus: (event) => void event.relatedTarget,
  onKeydown: (event) => void event.key,
};
void triggerProps;
const trigger: Trigger = "contextMenu";
const position: Position = "leftTopOver";
const arrowBounding: ArrowBounding = {
  width: 8,
  height: 8,
  offsetX: 2,
  offsetY: 2,
};
const content: RenderContent = (scope: RenderContentProps) => {
  void scope.initialFocusRef;
  return false;
};
const props: TooltipProps = {
  class: ["tooltip-popup", { active: true }, ["nested-popup"]],
  trigger,
  position,
  arrowBounding,
  content,
  visible: undefined,
  mouseEnterDelay: 0,
  mouseLeaveDelay: 0,
  spacing: { x: 2, y: 3 },
  margin: { marginTop: 1, marginLeft: 2, marginBottom: 3, marginRight: 4 },
  keepDOM: true,
  onVisibleChange: (value) => void value,
  onEscKeyDown: (event) => event.preventDefault(),
  onClickOutSide: (event) => void event.composedPath(),
};
const slots: TooltipSlots = {
  default: (scope: TooltipTriggerScope) => (
    <button
      {...scope.attrs}
      {...scope.triggerProps}
      onClick={(event: unknown) => {
        if (event instanceof MouseEvent) composeClick(scope, event);
      }}
      ref={scope.getTriggerRef("trigger")}
    >
      Trigger
    </button>
  ),
  content: ({ initialFocusRef }) => (
    <button ref={initialFocusRef}>Content</button>
  ),
  arrow: ({ placement }) => <i data-placement={placement.value} />,
};
const api = ref<TooltipInstance | null>(null);
const positive = (
  <>
    <Tooltip {...props} ref={api} v-slots={slots} />
    <SubpathTooltip
      class={{ "custom-popup": true }}
      content={0}
      v-slots={{
        default: ({ triggerRef, triggerProps }) => (
          <span {...triggerProps} ref={triggerRef}>
            Trigger
          </span>
        ),
      }}
    />
  </>
);
api.value?.focusTrigger();
const repositioned: Record<string, string | number> | undefined =
  api.value?.rePosition();
const popupId: string | undefined = api.value?.getPopupId();
void [repositioned, popupId];
void positive;
