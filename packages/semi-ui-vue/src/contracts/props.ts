/**
 * Inspect a caller-owned props bag or Vue's public attrs before normalization.
 * Observed keys must stay out of runtime props declarations. A normalized props
 * object contains declared keys even when the caller omitted them.
 * Read inside a reactive getter; do not snapshot attrs with object spread.
 */
export function hasProvidedProp(
  source: Readonly<Record<string, unknown>>,
  key: string,
): boolean {
  return Object.hasOwn(source, key);
}
