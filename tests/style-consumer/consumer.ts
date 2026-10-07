import semiTheme, {
  type SemiThemeOptions,
  version,
} from "vite-plugin-semi-theme";

const options: SemiThemeOptions = {
  prefix: "consumer",
  tokens: { "color-primary": "rgb(17, 105, 170)" },
  darkTokens: { "color-primary": "rgb(144, 202, 249)" },
  scss: { variables: { "height-control-default": "40px" } },
  styles: [
    "input",
    "spin",
    "iconButton",
    "button",
    "divider",
    "space",
    "grid",
    "layout",
    "skeleton",
    "highlight",
    "progress",
    "overflowList",
    "avatar",
    "tag",
    "badge",
    "typography",
    "empty",
  ],
};

const plugin = semiTheme(options);
void [plugin, version];

// @ts-expect-error Prefixes are strings because they become CSS identifiers.
semiTheme({ prefix: 1 });
// @ts-expect-error CSS token values cannot be arbitrary objects.
semiTheme({ tokens: { color: { value: "#fff" } } });
// @ts-expect-error Dark tokens use the same scalar CSS-value contract.
semiTheme({ darkTokens: { color: false } });
// @ts-expect-error SCSS variables only accept scalar Sass values.
semiTheme({ scss: { variables: { radius: [] } } });
// @ts-expect-error Style entries are restricted to the explicit public set.
semiTheme({ styles: ["unknown"] });
