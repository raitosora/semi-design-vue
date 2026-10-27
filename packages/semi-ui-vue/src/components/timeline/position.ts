/** Position precedence from Semi 2.103.0 timeline/index.tsx (fixed upstream). */
export function timelinePosition(
  mode: unknown,
  position: unknown,
  index: number,
): string {
  if (mode === "left" || mode === "right") return `semi-timeline-item-${mode}`;
  if (position) return `semi-timeline-item-${position}`;
  if (mode === "center") return "semi-timeline-item-left";
  if (mode === "alternate")
    return index % 2 === 0
      ? "semi-timeline-item-left"
      : "semi-timeline-item-right";
  return "";
}
