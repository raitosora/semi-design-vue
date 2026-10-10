/** Keep ordinary DOM attributes and callable listeners without destructive setters. */
export function safeCardAttrs(attrs: Readonly<Record<string, unknown>>) {
  return Object.fromEntries(
    Object.entries(attrs).filter(([key, value]) => {
      const name = key
        .replace(/^[.^]+/, "")
        .replaceAll("-", "")
        .toLowerCase();
      if (
        [
          "innerhtml",
          "outerhtml",
          "textcontent",
          "innertext",
          "outertext",
          "children",
          "ref",
          "class",
          "style",
        ].includes(name)
      )
        return false;
      return (
        !name.startsWith("on") ||
        typeof value === "function" ||
        (Array.isArray(value) &&
          value.every((handler) => typeof handler === "function"))
      );
    }),
  );
}
