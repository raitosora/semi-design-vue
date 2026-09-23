import { createVaporApp, defineVaporComponent, nextTick, ref } from "vue";
import {
  Button,
  ButtonGroup,
  SplitButtonGroup,
  semiGlobal,
  type ButtonGroupProps,
} from "semi-ui-vue";
import ButtonFromSubpath, {
  Button as NamedButton,
  ButtonGroup as GroupFromButtonEntry,
  SplitButtonGroup as SplitFromButtonEntry,
} from "semi-ui-vue/button";
import * as buttonEntry from "semi-ui-vue/button";
import ButtonGroupFromSubpath, {
  ButtonGroup as NamedButtonGroup,
} from "semi-ui-vue/button/buttonGroup";
import SplitButtonGroupFromSubpath, {
  SplitButtonGroup as NamedSplitButtonGroup,
} from "semi-ui-vue/button/splitButtonGroup";
import IconHome from "semi-icons-vue/IconHome";
import "semi-ui-vue/styles/components/button.css";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

export async function checkButtonConsumer() {
  assert(
    Button === ButtonFromSubpath && Button === NamedButton,
    "Button entry identities differ",
  );
  assert(
    ButtonGroup === GroupFromButtonEntry &&
      ButtonGroup === ButtonGroupFromSubpath &&
      ButtonGroup === NamedButtonGroup,
    "ButtonGroup entry identities differ",
  );
  assert(
    SplitButtonGroup === SplitFromButtonEntry &&
      SplitButtonGroup === SplitButtonGroupFromSubpath &&
      SplitButtonGroup === NamedSplitButtonGroup,
    "SplitButtonGroup entry identities differ",
  );
  assert(
    Button.elementType === "Button" &&
      Button.__SemiComponentName__ === "Button",
    "Button markers are unavailable",
  );
  assert(
    !Object.hasOwn(Button, "Group"),
    "Button must not expose a static Group",
  );
  assert(
    !Object.hasOwn(buttonEntry, "BaseButton"),
    "BaseButton must remain a type-only, private implementation detail",
  );
  semiGlobal.configure({
    overrideDefaultProps: {
      Button: { type: "danger", theme: "solid", size: "large" },
    },
  });
  const host = document.createElement("div");
  document.body.append(host);
  const label = ref("Save");
  const loading = ref(true);
  const group = ref<ButtonGroupProps>({
    disabled: true,
    size: "small" as const,
    type: "secondary" as const,
    theme: "outline" as const,
  });
  const count = ref(2);
  let clicks = 0;
  let submits = 0;
  let groupClicks = 0;
  const GroupChildren = defineVaporComponent(() => (
    <>
      <Button
        className="packed-group-own"
        disabled={undefined}
        size="large"
        text="Own"
        type="warning"
      />
      {count.value > 1 && (
        <Button className="packed-group-inherited" text="Inherited" />
      )}
    </>
  ));
  const SplitChildren = defineVaporComponent(() => (
    <>
      {Array.from({ length: count.value }, (_, index) => (
        <Button className="packed-split-button" key={index} text={index} />
      ))}
    </>
  ));
  const app = createVaporApp(() => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submits++;
      }}
    >
      <Button
        className="packed-global-button"
        v-slots={{ default: () => <span>Global</span> }}
      />
      <Button
        className="packed-button"
        htmlType="submit"
        loading={loading.value}
        onClick={(event) => {
          assert(event instanceof MouseEvent, "Button lost native click event");
          clicks++;
        }}
        v-slots={{
          default: () => <span data-button-label="">{label.value}</span>,
          icon: (scope) => (
            <IconHome
              data-button-icon=""
              fill={scope.fill?.[0] ?? "currentColor"}
            />
          ),
        }}
      />
      <div onClick={() => groupClicks++}>
        <ButtonGroup
          {...group.value}
          className="packed-button-group"
          v-slots={{ default: () => <GroupChildren /> }}
        />
      </div>
      <SplitButtonGroup
        className="packed-split-group"
        v-slots={{ default: () => <SplitChildren /> }}
      />
    </form>
  ));
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    const button = () =>
      host.querySelector<HTMLButtonElement>(".packed-button")!;
    const globalButton = host.querySelector<HTMLButtonElement>(
      ".packed-global-button",
    )!;
    assert(
      globalButton.classList.contains("semi-button-danger") &&
        globalButton.classList.contains("semi-button-size-large"),
      "Global Button defaults were not captured",
    );
    assert(
      getComputedStyle(button()).pointerEvents === "none",
      "Loading Button CSS was not installed",
    );
    button().click();
    assert(
      clicks === 1 && submits === 1,
      "Loading Button did not retain native programmatic click/submit semantics",
    );
    loading.value = false;
    label.value = "Updated";
    await nextTick();
    assert(
      button().textContent?.includes("Updated") &&
        button().querySelector("[data-button-icon]"),
      "Dynamic Button slots became stale",
    );
    const own = host.querySelector<HTMLButtonElement>(".packed-group-own")!;
    const inherited = host.querySelector<HTMLButtonElement>(
      ".packed-group-inherited",
    )!;
    assert(
      !own.disabled &&
        own.classList.contains("semi-button-warning") &&
        own.classList.contains("semi-button-size-large"),
      "Own undefined/props did not take ButtonGroup precedence correctly",
    );
    assert(
      inherited.disabled &&
        inherited.classList.contains("semi-button-danger-disabled") &&
        inherited.classList.contains("semi-button-outline") &&
        inherited.classList.contains("semi-button-size-large"),
      `Global defaults or ButtonGroup disabled/theme precedence drifted: ${inherited.outerHTML}`,
    );
    inherited.click();
    assert(groupClicks === 0, "Disabled grouped Button accepted native click");
    own.click();
    assert(
      Number(groupClicks) === 1,
      "ButtonGroup did not retain bubbling native event",
    );
    group.value = {
      disabled: false,
      size: "large",
      type: "danger",
      theme: "solid",
    };
    count.value = 1;
    await nextTick();
    await Promise.resolve();
    assert(
      !host.querySelector<HTMLButtonElement>(".packed-group-inherited") &&
        host.querySelectorAll(".packed-split-button").length === 1,
      "Dynamic ButtonGroup/SplitButtonGroup children did not update",
    );
    const split = host.querySelector<HTMLButtonElement>(
      ".packed-split-button",
    )!;
    assert(
      split.classList.contains("semi-button-first") &&
        split.classList.contains("semi-button-last"),
      "SplitButtonGroup did not refresh native boundaries",
    );
    app.unmount();
    mounted = false;
    assert(!host.textContent, "Button consumer teardown left DOM");
    return "button consumer passed";
  } finally {
    semiGlobal.configure({});
    if (mounted) app.unmount();
    host.remove();
  }
}
