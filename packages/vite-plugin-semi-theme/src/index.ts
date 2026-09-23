import type { Plugin } from "vite";

export const SEMI_THEME_VIRTUAL_CSS_ID = "virtual:semi-theme.css";
export const SEMI_THEME_VIRTUAL_SCSS_ID = "virtual:semi-theme.scss";
export const version = "0.0.0";

const entries = {
  base: "semi-ui-vue/styles/base.scss",
  input: "semi-ui-vue/styles/components/input.scss",
  tooltip: "semi-ui-vue/styles/components/tooltip.scss",
  spin: "semi-ui-vue/styles/components/spin.scss",
  iconButton: "semi-ui-vue/styles/components/iconButton.scss",
  button: "semi-ui-vue/styles/components/button.scss",
} as const;
type Values = Readonly<Record<string, string | number>>;
export interface SemiThemeOptions {
  /** Classes only; CSS variables retain the upstream --semi-* namespace. */
  prefix?: string;
  /** Explicit SCSS entries for virtual:semi-theme.scss; defaults to base only. */
  styles?: readonly (keyof typeof entries)[];
  /** Global light variables, keyed without --semi-. Load after base styles. */
  tokens?: Values;
  /** Global body[theme-mode=dark] overrides. */
  darkTokens?: Values;
  /** Sass variable names omit $. Unknown variables fail during Sass compilation. */
  scss?: { variables?: Values };
}

function validateValues(values: Values, label: string) {
  for (const [name, value] of Object.entries(values)) {
    if (!/^[a-z][a-z0-9-]*$/i.test(name))
      throw new TypeError(`Invalid ${label} name: ${name}`);
    if (
      (typeof value !== "string" && typeof value !== "number") ||
      (typeof value === "number" && !Number.isFinite(value)) ||
      (typeof value === "string" && (!value.trim() || /[;{}@\r\n]/.test(value)))
    )
      throw new TypeError(`Invalid ${label} value: ${name}`);
  }
}

function cssBlock(selector: string, values: Values) {
  const declarations = Object.entries(values)
    .map(([name, value]) => `  --semi-${name}: ${value};`)
    .join("\n");
  return declarations ? `${selector} {\n${declarations}\n}\n` : "";
}

/** Explicit style generation; never rewrites application Sass or additionalData. */
export default function semiTheme(options: SemiThemeOptions = {}): Plugin {
  const prefix = options.prefix ?? "semi";
  if (typeof prefix !== "string" || !/^[a-z][a-z0-9-]*$/i.test(prefix))
    throw new TypeError("Semi theme prefix must be a CSS class identifier.");
  const styles = [...new Set<keyof typeof entries>(options.styles ?? ["base"])];
  for (const entry of styles) {
    if (!Object.hasOwn(entries, entry))
      throw new TypeError(`Unknown Semi style entry: ${entry}`);
  }
  const variables = { ...options.scss?.variables };
  if (Object.hasOwn(variables, "semi-prefix"))
    throw new TypeError("Configure semi-prefix through the prefix option.");
  validateValues(variables, "SCSS variable");
  validateValues(options.tokens ?? {}, "light token");
  validateValues(options.darkTokens ?? {}, "dark token");
  const css =
    cssBlock("body", options.tokens ?? {}) +
    cssBlock('body[theme-mode="dark"]', options.darkTokens ?? {});
  const configuration = [
    `$semi-prefix: ${JSON.stringify(prefix)}`,
    ...Object.entries(variables).map(([name, value]) => `$${name}: ${value}`),
  ].join(", ");
  const scss = styles
    .map(
      (entry) =>
        `@use ${JSON.stringify(entries[entry])} as semi_${entry} with (${configuration});`,
    )
    .join("\n");
  const sources = new Map([
    [SEMI_THEME_VIRTUAL_CSS_ID, css],
    [SEMI_THEME_VIRTUAL_SCSS_ID, scss],
  ]);
  return {
    name: "semi-theme",
    resolveId(id) {
      return sources.has(id) ? `\0${id}` : null;
    },
    load(id) {
      return id.startsWith("\0") ? (sources.get(id.slice(1)) ?? null) : null;
    },
  };
}
