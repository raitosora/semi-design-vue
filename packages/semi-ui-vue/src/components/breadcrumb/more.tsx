import {
  computed,
  createFor,
  defineVaporComponent,
  type Block,
  type ShallowRef,
} from "vue";
import Icon, { type IconSvgScope } from "semi-icons-vue/Icon";
import type { JSX } from "vue-jsx";
import { IconMore } from "semi-icons-vue";
import Popover from "../popover/index.js";
import type { PopoverTriggerScope } from "../popover/types.js";
import { BreadcrumbContentView } from "./render.js";
import { expandBreadcrumbOnKeyPress } from "./input.js";
import type { BreadcrumbContext } from "./context.js";
import type { BreadcrumbContent, BreadcrumbItemRenderer } from "./types.js";
const PopupContent = defineVaporComponent<
  { expand: () => void },
  {},
  string,
  {}
>(
  (props) => (
    <span
      onClick={props.expand}
      onKeypress={(event) => expandBreadcrumbOnKeyPress(event, props.expand)}
      style={{ display: "contents" }}
    >
      <slot />
    </span>
  ),
  { props: ["expand"], inheritAttrs: false },
);
interface PopupEntry {
  readonly render: BreadcrumbItemRenderer | undefined;
  readonly index: number;
}
const PopupItems = defineVaporComponent<
  {
    renderers: readonly BreadcrumbItemRenderer[];
    separator: BreadcrumbContent;
  },
  {},
  string,
  {}
>(
  (props) =>
    createFor(
      () =>
        Array.from(
          props.renderers,
          (render, index): PopupEntry => ({ render, index }),
        ),
      (entry: ShallowRef<PopupEntry>) =>
        (
          <>
            {entry.value.render ? (
              <>
                <BreadcrumbContentView content={entry.value.render} />
                {entry.value.index !== props.renderers.length - 1 ? (
                  <span class="semi-breadcrumb-restItem">
                    <BreadcrumbContentView content={props.separator} />
                  </span>
                ) : null}
              </>
            ) : null}
          </>
        ) as Block,
      // Fixed upstream restItem fragments are keyed by their rest position.
      (entry) => entry.index,
    ),
  { props: ["renderers", "separator"], inheritAttrs: false },
);
export const BreadcrumbMore = defineVaporComponent<
  {
    context: BreadcrumbContext;
    expand: () => void;
    bind: (element: HTMLSpanElement | null) => void;
  },
  {},
  string,
  {}
>(
  (props) => {
    const renderers = computed<readonly BreadcrumbItemRenderer[]>(() => {
      const byIndex = new Map(
        props.context.entries.value.map((entry) => [
          entry.sourceIndex?.value ?? entry.index.value,
          entry,
        ]),
      );
      const rest = props.context.rest.value;
      // slice/map preserve holes and their indices in the fixed source.
      return Object.assign(
        new Array<BreadcrumbItemRenderer>(rest.length),
        Object.fromEntries(
          rest.flatMap((sourceIndex, index) => {
            const entry = byIndex.get(sourceIndex);
            return entry ? [[index, entry.render]] : [];
          }),
        ),
      );
    });
    const renderer = computed(() => props.context.props.value.renderMore);
    const content = computed<BreadcrumbContent>(() => {
      const renderMore = renderer.value;
      const rest = renderers.value;
      // This content is consumed only by the function-guarded branch below.
      return () => renderMore!(rest);
    });
    return (
      <span class="semi-breadcrumb-collapse" ref={props.bind}>
        <span class="semi-breadcrumb-item-wrap">
          <span
            aria-label="Expand breadcrumb items"
            class="semi-breadcrumb-item semi-breadcrumb-item-more"
            onClick={props.expand}
            onKeypress={(event) =>
              expandBreadcrumbOnKeyPress(event, props.expand)
            }
            role="button"
            tabindex={0}
          >
            {typeof props.context.props.value.renderMore === "function" ? (
              <BreadcrumbContentView content={content.value} />
            ) : props.context.props.value.moreType === "default" ? (
              <Icon type="more">
                {{
                  default: (scope: IconSvgScope) => (
                    <IconMore size={scope.size} />
                  ),
                }}
              </Icon>
            ) : props.context.props.value.moreType === "popover" ? (
              <Popover
                showArrow
                style={{ padding: "12px" }}
                v-slots={{
                  default: (scope: PopoverTriggerScope) => (
                    <span
                      {...({
                        ...scope.attrs,
                        ...scope.triggerProps,
                      } as JSX.IntrinsicElements["span"])}
                      ref={scope.triggerRef}
                    >
                      <Icon type="more">
                        {{
                          default: (scope: IconSvgScope) => (
                            <IconMore size={scope.size} />
                          ),
                        }}
                      </Icon>
                    </span>
                  ),
                  content: () =>
                    (
                      <PopupContent expand={props.expand}>
                        {() => (
                          <PopupItems
                            renderers={renderers.value}
                            separator={props.context.separator}
                          />
                        )}
                      </PopupContent>
                    ) as Block,
                }}
              />
            ) : null}
          </span>
          <span class="semi-breadcrumb-separator" x-semi-prop="separator">
            <BreadcrumbContentView content={props.context.separator} />
          </span>
        </span>
      </span>
    );
  },
  { props: ["context", "expand", "bind"], inheritAttrs: false },
);
