/** Fixed copy-text-to-clipboard 2.2.0 behavior, with owner-document and exception-safe cleanup. */
export function copyText(content: string, document: Document): boolean {
  const input = document.createElement("textarea");
  const previous = document.activeElement as HTMLElement | null;
  const selection = document.getSelection();
  const range =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  input.value = content;
  input.setAttribute("readonly", "");
  input.style.cssText =
    "contain:strict;position:absolute;left:-9999px;font-size:12pt;";
  try {
    document.body.append(input);
    input.select();
    input.selectionStart = 0;
    input.selectionEnd = content.length;
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    }
  } finally {
    input.remove();
    if (range && selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    previous?.focus();
  }
}
