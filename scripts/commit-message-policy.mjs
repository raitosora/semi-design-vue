const headerPattern =
  /^(init|feat|fix|perf|style|docs|test|refactor|build|ci|chore|revert|wip|workflow|types|release)\([^\s()]+\)!?: \S(?:.*\S)?$/u;

export function inspectCommitMessage(message, { merge = false } = {}) {
  if (merge) return [];
  const header = typeof message === "string" ? message.split(/\r?\n/u)[0] : "";
  const errors = [];
  if (!headerPattern.test(header) || /\p{Cc}/u.test(header))
    errors.push(
      "Use an allowed type, a nonempty scope and a subject: type(scope): description.",
    );
  if ([...header].length > 108)
    errors.push("Header must not exceed 108 characters.");
  return errors;
}
