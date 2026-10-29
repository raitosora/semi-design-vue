import {
  createComponent,
  createFor,
  defineVaporComponent,
  onBeforeUnmount,
  shallowRef,
  VaporTeleport,
  type Block,
  type ShallowRef,
} from "vue";
/** Each invocation owns one native outlet; content stays in its declaring owner. */
const Outlet = defineVaporComponent<
  { acquire: (element: HTMLElement) => () => void },
  {},
  string,
  {}
>(
  (props) => {
    let release: (() => void) | undefined;
    const bind = (element: HTMLSpanElement | null) => {
      release?.();
      release = element ? props.acquire(element) : undefined;
    };
    onBeforeUnmount(() => {
      release?.();
      release = undefined;
    });
    return <span ref={bind} style={{ display: "contents" }} />;
  },
  { props: ["acquire"], inheritAttrs: false },
);
export function createBreadcrumbOutlets(render: () => Block) {
  const targets = shallowRef<readonly HTMLElement[]>([]);
  let disposed = false;
  let targetList: readonly HTMLElement[] = [];
  onBeforeUnmount(() => {
    disposed = true;
    targetList = [];
    targets.value = targetList;
  });
  const acquire = (element: HTMLElement) => {
    if (!disposed) {
      targetList = [...targetList, element];
      targets.value = targetList;
    }
    return () => {
      if (!disposed) {
        targetList = targetList.filter((target) => target !== element);
        targets.value = targetList;
      }
    };
  };
  const content = createFor(
    () => targets.value,
    (target: ShallowRef<HTMLElement>) =>
      (<VaporTeleport to={target.value}>{render()}</VaporTeleport>) as Block,
    (target) => target,
  );
  return {
    Content: defineVaporComponent(() => content, { inheritAttrs: false }),
    render: () => createComponent(Outlet, { acquire: () => acquire }),
  };
}
