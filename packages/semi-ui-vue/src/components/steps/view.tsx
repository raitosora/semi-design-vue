import { computed, defineVaporComponent, useSlots, type Ref } from "vue";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconChevronRight,
  IconTickCircle,
} from "semi-icons-vue";
import Icon, { type IconSvgScope } from "semi-icons-vue/Icon";
import { StepsCustomIcon } from "./icon.js";
import { StepsContentView } from "./render.js";
import type { Size, StepProps, StepsContent } from "./types.js";
export interface StepViewState {
  readonly type: "fill" | "basic" | "nav";
  readonly prefix: string;
  readonly item: StepProps;
  readonly label: string | undefined;
  readonly className: string | undefined;
  readonly localClass: unknown;
  readonly status: unknown;
  readonly active: boolean;
  readonly done: boolean;
  readonly number: StepsContent;
  readonly size: Size | undefined;
  readonly last: boolean;
  readonly icon: StepsContent;
  readonly hasIcon: boolean;
  readonly clickable: boolean;
  readonly element: Ref<HTMLDivElement | null>;
  readonly click: (event: MouseEvent) => void;
  readonly keydown: (event: KeyboardEvent) => void;
}
const IconView = defineVaporComponent<{ state: StepViewState }, {}, string, {}>(
  (props: { state: StepViewState }) => {
    const slots = useSlots();
    const size = computed(() =>
      props.state.type === "fill"
        ? "extra-large"
        : props.state.size === "small"
          ? "large"
          : props.state.size === "default"
            ? "extra-large"
            : undefined,
    );
    const show = computed(() =>
      props.state.hasIcon
        ? !!slots.icon ||
          (props.state.type === "basic"
            ? typeof props.state.icon === "function"
            : !!props.state.icon)
        : ["wait", "process"].includes(props.state.status as string)
          ? props.state.type === "basic" || !!props.state.number
          : ["error", "finish", "warning"].includes(
              props.state.status as string,
            ),
    );
    return (
      <>
        {props.state.hasIcon && !slots.icon ? (
          <StepsCustomIcon
            basic={props.state.type === "basic"}
            content={props.state.icon}
            hover={props.state.clickable}
            prefix={props.state.prefix}
          />
        ) : show.value ? (
          props.state.type === "basic" ? (
            <span
              class={[
                `${props.state.prefix}-icon`,
                props.state.hasIcon && `${props.state.prefix}-custom-icon`,
                !props.state.hasIcon &&
                  props.state.status === "process" &&
                  `${props.state.prefix}-icon-process`,
              ]}
            >
              {props.state.hasIcon ? (
                <slot name="icon" />
              ) : props.state.status === "error" ? (
                <Icon size={size.value} type="alert_circle">
                  {{
                    default: ({ size }: IconSvgScope) => (
                      <IconAlertCircle size={size} />
                    ),
                  }}
                </Icon>
              ) : props.state.status === "finish" ? (
                <Icon size={size.value} type="tick_circle">
                  {{
                    default: ({ size }: IconSvgScope) => (
                      <IconTickCircle size={size} />
                    ),
                  }}
                </Icon>
              ) : props.state.status === "warning" ? (
                <Icon size={size.value} type="alert_triangle">
                  {{
                    default: ({ size }: IconSvgScope) => (
                      <IconAlertTriangle size={size} />
                    ),
                  }}
                </Icon>
              ) : props.state.type === "basic" ? (
                <span class={`${props.state.prefix}-number-icon`}>
                  <StepsContentView content={props.state.number} />
                </span>
              ) : (
                <StepsContentView content={props.state.number} />
              )}
            </span>
          ) : (
            <div
              class={[
                `${props.state.prefix}-left`,
                `${props.state.prefix}-${props.state.hasIcon ? "icon" : "plain"}`,
                !props.state.hasIcon &&
                  props.state.status === "process" &&
                  `${props.state.prefix}-icon-process`,
                props.state.clickable && `${props.state.prefix}-hover`,
              ]}
            >
              {props.state.hasIcon ? (
                <slot name="icon" />
              ) : props.state.status === "error" ? (
                <Icon size={size.value} type="alert_circle">
                  {{
                    default: ({ size }: IconSvgScope) => (
                      <IconAlertCircle size={size} />
                    ),
                  }}
                </Icon>
              ) : props.state.status === "finish" ? (
                <Icon size={size.value} type="tick_circle">
                  {{
                    default: ({ size }: IconSvgScope) => (
                      <IconTickCircle size={size} />
                    ),
                  }}
                </Icon>
              ) : props.state.status === "warning" ? (
                <Icon size={size.value} type="alert_triangle">
                  {{
                    default: ({ size }: IconSvgScope) => (
                      <IconAlertTriangle size={size} />
                    ),
                  }}
                </Icon>
              ) : (
                <StepsContentView content={props.state.number} />
              )}
            </div>
          )
        ) : null}
      </>
    );
  },
  { props: ["state"], inheritAttrs: false },
);
export const StepView = defineVaporComponent<
  { state: StepViewState },
  {},
  string,
  {}
>(
  (props: { state: StepViewState }) => {
    const slots = useSlots();
    const classes = computed(() => [
      props.state.prefix,
      props.state.localClass,
      props.state.className,
      props.state.type !== "nav" &&
        (props.state.type === "basic" || !!props.state.status) &&
        `${props.state.prefix}-${props.state.status}`,
      props.state.type !== "fill" &&
        props.state.active &&
        `${props.state.prefix}-active`,
      props.state.type === "basic" &&
        props.state.done &&
        `${props.state.prefix}-done`,
      props.state.type === "basic" &&
        props.state.clickable &&
        `${props.state.prefix}-hover`,
      props.state.type !== "nav" &&
        props.state.clickable &&
        `${props.state.prefix}-clickable`,
      props.state.type !== "nav" &&
        props.state.clickable &&
        (props.state.type === "basic" || !!props.state.status) &&
        `${props.state.prefix}-${props.state.status}-hover`,
      props.state.type === "fill" &&
        props.state.clickable &&
        !!props.state.status &&
        `${props.state.prefix}-${props.state.status}-active`,
    ]);
    const hasIcon = computed(() => Boolean(slots.icon));
    const iconSlots = computed(() =>
      hasIcon.value ? { icon: () => <slot name="icon" /> } : {},
    );
    return (
      <div
        aria-current="step"
        aria-label={props.state.label}
        class={classes.value}
        onClick={(event) => props.state.click(event as unknown as MouseEvent)}
        onKeydown={(event) =>
          props.state.keydown(event as unknown as KeyboardEvent)
        }
        ref={props.state.element}
        role={props.state.item.role}
        style={props.state.item.style}
        tabindex={0}
      >
        {props.state.type === "fill" ? (
          <>
            <IconView state={props.state} v-slots={iconSlots.value} />
            <div class={`${props.state.prefix}-content`}>
              <div
                class={`${props.state.prefix}-title`}
                title={
                  typeof props.state.item.title === "string" && !slots.title
                    ? props.state.item.title
                    : undefined
                }
              >
                <span class={`${props.state.prefix}-title-text`}>
                  {slots.title ? (
                    <slot name="title" />
                  ) : (
                    <StepsContentView content={props.state.item.title} />
                  )}
                </span>
              </div>
              <div
                class={`${props.state.prefix}-description`}
                title={
                  typeof props.state.item.description === "string" &&
                  !slots.description
                    ? props.state.item.description
                    : undefined
                }
              >
                {slots.description ? (
                  <slot name="description" />
                ) : (
                  <StepsContentView content={props.state.item.description} />
                )}
              </div>
            </div>
          </>
        ) : (
          <div class={`${props.state.prefix}-container`}>
            {props.state.type === "basic" ? (
              <div class={`${props.state.prefix}-left`}>
                <IconView state={props.state} v-slots={iconSlots.value} />
              </div>
            ) : null}
            <div class={`${props.state.prefix}-content`}>
              <div class={`${props.state.prefix}-title`}>
                {props.state.type === "basic" ? (
                  <div
                    class={[
                      `${props.state.prefix}-title-text`,
                      !slots.title &&
                        !props.state.item.title &&
                        `${props.state.prefix}-title-text-empty`,
                    ]}
                  >
                    {slots.title ? (
                      <slot name="title" />
                    ) : (
                      <StepsContentView content={props.state.item.title} />
                    )}
                  </div>
                ) : slots.title ? (
                  <slot name="title" />
                ) : (
                  <StepsContentView content={props.state.item.title} />
                )}
              </div>
              {props.state.type === "basic" ? (
                slots.description || props.state.item.description ? (
                  <div class={`${props.state.prefix}-description`}>
                    {slots.description ? (
                      <slot name="description" />
                    ) : (
                      <StepsContentView
                        content={props.state.item.description}
                      />
                    )}
                  </div>
                ) : (
                  <StepsContentView content={props.state.item.description} />
                )
              ) : null}
            </div>
            {props.state.type === "nav" && !props.state.last ? (
              <div class={`${props.state.prefix}-icon`}>
                <Icon size="small" type="chevron_right">
                  {{
                    default: ({ size }: IconSvgScope) => (
                      <IconChevronRight size={size} />
                    ),
                  }}
                </Icon>
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  },
  { props: ["state"], inheritAttrs: false },
);
