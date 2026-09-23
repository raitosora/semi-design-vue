import {
  computed,
  defineVaporComponent,
  shallowRef,
  useAttrs,
  useSlots,
} from "vue";
import { BaseButton } from "../../internal/button/BaseButton.js";
import { createDefaultPropsResolver, semiGlobal } from "../../context/index.js";
import IconButton from "../iconButton/index.js";
import type { IconButtonIconScope } from "../iconButton/types.js";
import { useButtonGroup } from "./group-context.js";
import type { ButtonProps, ButtonSlots } from "./types.js";

const builtins = Object.freeze({});

function own(source: Readonly<Record<string, unknown>>, key: string) {
  return Object.hasOwn(source, key);
}

const ButtonComponent = defineVaporComponent<ButtonProps, {}, string, {}>(
  () => {
    // `useAttrs` retains the presence of `undefined`; declared runtime props do not.
    const attrs = useAttrs() as Readonly<Record<string, unknown>>;
    const slots = useSlots();
    const group = useButtonGroup();
    const resolver = createDefaultPropsResolver(semiGlobal, "Button", builtins);
    const direct = shallowRef(false);
    let release: (() => void) | undefined;
    const onButtonElement = (element: HTMLButtonElement | null) => {
      release?.();
      release =
        element && group
          ? group.value.register({
              element,
              readProps: () => resolved.value,
              setDirect: (value) => {
                direct.value = value;
              },
            })
          : undefined;
    };
    const capturedGlobal = resolver.resolve({});
    const resolved = computed(() => {
      const groupValue = direct.value ? group?.value : undefined;
      const raw: Record<string, unknown> = { ...capturedGlobal };
      // React applies global defaultProps to an omitted or `undefined` child
      // value. Keep own undefined only where no captured global has that key.
      for (const key of Reflect.ownKeys(attrs)) {
        const name = key as string;
        const value = attrs[name];
        if (value !== undefined || !own(capturedGlobal, name))
          raw[name] = value;
      }
      for (const key of ["disabled", "size", "type"] as const) {
        if (!own(raw, key) && groupValue?.present.has(key))
          raw[key] = groupValue[key];
      }
      for (const key of ["theme", "colorful"] as const) {
        if (groupValue?.present.has(key)) {
          const value = groupValue[key];
          raw[key] =
            value === undefined && own(capturedGlobal, key)
              ? capturedGlobal[key]
              : value;
        }
      }
      return raw as ButtonProps;
    });
    const hasIcon = computed(() => slots.icon !== undefined);
    // Slot identity is the Vapor replacement for the upstream `icon` ReactNode;
    // it is never rendered for detection.
    const loadingIcon = computed(
      () => resolved.value.loading === true && resolved.value.disabled !== true,
    );
    const baseAttrs = computed(() => {
      const value = resolved.value;
      const {
        iconPosition: _a,
        iconSize: _b,
        iconStyle: _c,
        loading: _d,
        noHorizontalPadding: _e,
        prefixCls: _f,
        text: _g,
        ...native
      } = value;
      return {
        ...native,
        block: value.block,
        circle: value.circle,
        className: value.className,
        colorful: value.colorful,
        contentClassName: value.contentClassName,
        disabled: value.disabled,
        htmlType: value.htmlType,
        size: value.size,
        style: value.style,
        theme: value.theme,
        type: value.type,
        onButtonElement,
      };
    });
    return (
      <>
        {hasIcon.value || loadingIcon.value ? (
          <IconButton
            {...baseAttrs.value}
            iconPosition={
              resolved.value.iconPosition as "left" | "right" | undefined
            }
            iconSize={resolved.value.iconSize}
            iconStyle={resolved.value.iconStyle}
            loading={resolved.value.loading as boolean | undefined}
            noHorizontalPadding={resolved.value.noHorizontalPadding}
            prefixCls={resolved.value.prefixCls as string | undefined}
            text={resolved.value.text}
            v-slots={{
              ...(slots.default ? { default: () => <slot /> } : {}),
              ...(slots.icon
                ? {
                    icon: (scope: IconButtonIconScope) => (
                      <slot fill={scope.fill} name="icon" />
                    ),
                  }
                : {}),
            }}
          />
        ) : (
          <BaseButton
            {...baseAttrs.value}
            annotateContent
            rootPrefixCls={resolved.value.prefixCls as string | undefined}
            text={resolved.value.text}
            v-slots={slots.default ? { default: () => <slot /> } : {}}
          />
        )}
      </>
    );
  },
  { props: [], inheritAttrs: false },
);

type ButtonComponentType = typeof ButtonComponent & {
  new (props: ButtonProps): { $props: ButtonProps; $slots: ButtonSlots };
};
export const Button = Object.assign(ButtonComponent, {
  __SemiComponentName__: "Button" as const,
  elementType: "Button" as const,
}) as ButtonComponentType & {
  readonly __SemiComponentName__: "Button";
  readonly elementType: "Button";
};
export default Button;
