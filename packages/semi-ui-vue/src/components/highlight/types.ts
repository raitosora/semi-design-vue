import type { CSSProperties } from "vue";

type SearchWord =
  | string
  | { text: string; className?: string; style?: Record<string, string> }
  | undefined;

export interface HighlightProps {
  autoEscape?: boolean | undefined;
  caseSensitive?: boolean | undefined;
  sourceString?: string | undefined;
  searchWords?: SearchWord[] | undefined;
  highlightStyle?: CSSProperties | undefined;
  highlightClassName?: string | undefined;
  component?: string | undefined;
}
