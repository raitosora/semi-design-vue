import {
  hasProvidedProp,
  useControllableValue,
  version as uiVersion,
} from "semi-ui-vue";
import { ref } from "vue";
import { version as animationVersion } from "semi-animation-vue";
import { version as iconsLabVersion } from "semi-icons-lab-vue";
import { version as iconsVersion } from "semi-icons-vue";
import { version as illustrationsVersion } from "semi-illustrations-vue";
import { version as themeVersion } from "vite-plugin-semi-theme";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
for (const version of [
  uiVersion,
  animationVersion,
  iconsLabVersion,
  iconsVersion,
  illustrationsVersion,
  themeVersion,
])
  assert(version === "0.0.0", "package version export must remain available");
assert(!hasProvidedProp({}, "value"), "missing prop must be absent");
for (const value of [undefined, false, 0, ""])
  assert(hasProvidedProp({ value }, "value"), "explicit prop must be present");
const uncontrolled = useControllableValue({
  isControlled: () => false,
  value: () => 10,
  defaultValue: () => 1,
});
assert(uncontrolled.value.value === 1, "uncontrolled starts at default");
uncontrolled.setValue(2);
assert(
  uncontrolled.value.value === 2,
  "uncontrolled setValue updates local state",
);
const external = ref(3);
const controlled = useControllableValue({
  isControlled: () => true,
  value: () => external.value,
  defaultValue: () => 0,
});
controlled.setValue(4);
assert(
  controlled.value.value === 3,
  "controlled setValue does not overwrite caller state",
);
external.value = 5;
assert(controlled.value.value === 5, "controlled state follows caller value");
console.log("Runtime protocol checks passed.");
