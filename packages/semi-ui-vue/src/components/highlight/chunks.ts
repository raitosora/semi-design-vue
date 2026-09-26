import type { HighlightProps } from "./types.js";

// Adapted from Semi packages/semi-foundation/highlight/foundation.ts at
// 8bed560dd3f36579f85b7a522f19762f2bace756 (MIT; based on highlight-words-core).
// Keep matching independent of BaseFoundation and lodash. This is private to
// Highlight; only the seven upstream UI props are part of the public contract.
export interface HighlightChunk {
  start: number;
  end: number;
  highlight: boolean;
  className: string | undefined;
  style: Record<string, string> | undefined;
}

type Query = Pick<
  HighlightProps,
  "sourceString" | "searchWords" | "autoEscape" | "caseSensitive"
>;

function* matches({
  sourceString = "",
  searchWords = [],
  autoEscape = true,
  caseSensitive = false,
}: Query): Generator<HighlightChunk> {
  const words = typeof searchWords === "string" ? [searchWords] : searchWords;
  // Native map/filter preserve upstream HasProperty semantics: skip sparse
  // holes, retain inherited indexes, and never change the caller's array.
  const keywords = words
    .map((word) => (typeof word === "string" ? { text: word } : word))
    // Upstream declares undefined members but throws when reading text.
    .filter((keyword) => keyword!.text);
  for (const keyword of keywords) {
    const pattern = autoEscape
      ? keyword!.text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
      : keyword!.text;
    const regex = new RegExp(pattern, caseSensitive ? "g" : "gi");
    // matchAll advances after empty matches using the same UTF-16 unit as the
    // upstream lastIndex++ loop; the absence of a u flag is intentional.
    for (const match of sourceString.matchAll(regex)) {
      if (!match[0].length) continue;
      yield {
        start: match.index,
        end: match.index + match[0].length,
        highlight: true,
        className: keyword!.className,
        style: keyword!.style,
      };
    }
  }
}

function* combine(chunks: HighlightChunk[]): Generator<HighlightChunk> {
  let previous: HighlightChunk | undefined;
  // Sorting the newly collected private array never mutates caller input.
  for (const chunk of chunks.sort(
    (first, second) => first.start - second.start,
  )) {
    if (previous && chunk.start <= previous.end) {
      previous = {
        start: previous.start,
        end: Math.max(previous.end, chunk.end),
        highlight: true,
        className: previous.className || chunk.className,
        style: { ...previous.style, ...chunk.style },
      };
    } else {
      if (previous) yield previous;
      previous = chunk;
    }
  }
  if (previous) yield previous;
}

function* fill(chunks: Iterable<HighlightChunk>, length: number) {
  let end = 0;
  for (const chunk of chunks) {
    if (chunk.start > end) {
      yield {
        start: end,
        end: chunk.start,
        highlight: false,
        className: undefined,
        style: undefined,
      };
    }
    yield chunk;
    end = chunk.end;
  }
  if (end < length) {
    yield {
      start: end,
      end: length,
      highlight: false,
      className: undefined,
      style: undefined,
    };
  }
}

export function findHighlightChunks(query: Query): HighlightChunk[] {
  return [
    ...fill(combine([...matches(query)]), query.sourceString?.length ?? 0),
  ];
}
