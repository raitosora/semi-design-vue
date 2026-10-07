import { computed, defineVaporComponent, onBeforeUnmount, ref } from "vue";
import Icon, { type IconSvgScope } from "semi-icons-vue/Icon";
import IconCopy from "semi-icons-vue/IconCopy";
import IconTick from "semi-icons-vue/IconTick";
import { createFoundationScope } from "semi-animation-vue/lifecycle";
import { useLocaleContext } from "../locale/context.js";
import Tooltip from "../tooltip/Tooltip.js";
import { TypographyContentView } from "./render.js";
import { copyText } from "./copy.js";
import { safeTypographyAttrs } from "./input.js";
import type {
  CopyableConfig,
  CopyEvent,
  TypographyNativeRef,
} from "./types.js";
import type { CSSProperties } from "vue";
const noop = () => undefined;
export interface CopyableProps extends CopyableConfig {
  readonly duration?: number | undefined;
  readonly style?: CSSProperties | undefined;
  readonly className?: string | undefined;
  readonly forwardRef?: TypographyNativeRef | undefined;
}
export const Copyable = defineVaporComponent<CopyableProps, {}, string, {}>(
  (props) => {
    const locale = useLocaleContext(() => "Typography");
    const copied = ref(false);
    const config = computed(
      () =>
        ({
          content: "",
          duration: 3,
          onCopy: noop,
          style: {},
          className: "",
          ...Object.fromEntries(
            Object.entries(props).filter(([, value]) => value !== undefined),
          ),
        }) as CopyableProps,
    );
    let generation = 0;
    const scope = createFoundationScope();
    let cancel: (() => void) | undefined;
    const copy = (event: CopyEvent) => {
      if (!scope.active) return;
      const content = config.value.content!;
      const document =
        (event.currentTarget as Node | null)?.ownerDocument ??
        globalThis.document;
      const result = copyText(content, document);
      config.value.onCopy?.(event, content, result);
      if (!scope.active) return;
      copied.value = true;
      cancel?.();
      const current = ++generation;
      cancel = scope.timeout(() => {
        if (current === generation) copied.value = false;
      }, config.value.duration! * 1000);
    };
    const bind = (element: HTMLElement | null) => {
      if (typeof props.forwardRef === "function") props.forwardRef(element);
      else if (props.forwardRef) props.forwardRef.value = element;
    };
    const custom = computed(() =>
      props.render
        ? () => props.render!(copied.value, copy, config.value)
        : undefined,
    );
    onBeforeUnmount(() => scope.dispose());
    return (
      <>
        {props.render ? (
          <TypographyContentView content={custom.value} />
        ) : (
          <span
            class={[
              config.value.className,
              copied.value
                ? "semi-typography-action-copied"
                : "semi-typography-action-copy",
            ]}
            ref={bind}
            style={{ marginLeft: "4px", ...config.value.style }}
          >
            {copied.value ? (
              props.successTip !== undefined ? (
                <TypographyContentView content={props.successTip} />
              ) : (
                <span>
                  <Icon type="tick">
                    {{
                      default: (scope: IconSvgScope) => (
                        <IconTick size={scope.size} />
                      ),
                    }}
                  </Icon>
                  {locale.value.componentLocale!.copied}
                </span>
              )
            ) : (
              <Tooltip
                content={
                  typeof props.copyTip === "function"
                    ? undefined
                    : props.copyTip === undefined
                      ? locale.value.componentLocale!.copy
                      : props.copyTip
                }
              >
                {{
                  default: (scope) => (
                    <a
                      {...safeTypographyAttrs(scope.triggerProps)}
                      class="semi-typography-action-copy-icon"
                      onClick={(event: unknown) => copy(event as CopyEvent)}
                      onKeypress={(value: unknown) => {
                        const event = value as KeyboardEvent;
                        if (event.key === "Enter" || event.keyCode === 13)
                          copy(event);
                      }}
                      ref={scope.triggerRef}
                      role="button"
                      tabindex={0}
                    >
                      {props.icon ? (
                        <TypographyContentView content={props.icon} />
                      ) : (
                        <Icon type="copy">
                          {{
                            default: (scope: IconSvgScope) => (
                              <IconCopy size={scope.size} />
                            ),
                          }}
                        </Icon>
                      )}
                    </a>
                  ),
                  ...(typeof props.copyTip === "function"
                    ? {
                        content: () => (
                          <TypographyContentView content={props.copyTip} />
                        ),
                      }
                    : {}),
                }}
              </Tooltip>
            )}
          </span>
        )}
      </>
    );
  },
  {
    props: [
      "duration",
      "style",
      "className",
      "content",
      "copyTip",
      "successTip",
      "icon",
      "onCopy",
      "render",
      "forwardRef",
    ],
    inheritAttrs: false,
  },
);
export default Copyable;
