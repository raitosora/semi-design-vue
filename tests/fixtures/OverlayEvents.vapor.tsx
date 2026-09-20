import {
  defineVaporComponent,
  delegate,
  delegateEvents,
  onMounted,
  ref,
} from "vue";

/** Exercise Vue's actual document delegation, separately from JSX's direct `on` output. */
export const OverlayEvents = defineVaporComponent<{
  handle: (event: Event) => void;
}>(
  (props) => {
    const button = ref<HTMLButtonElement>();
    onMounted(() => {
      delegateEvents("keydown", "pointerdown", "click");
      for (const type of ["keydown", "pointerdown", "click"])
        delegate(button.value!, type, (event: Event) => props.handle(event));
    });
    return <button ref={button}>Delegated trigger</button>;
  },
  { props: ["handle"] },
);
