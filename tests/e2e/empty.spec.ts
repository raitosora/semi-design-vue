import { emptyChecks } from "../../website/tests/empty-checks";
for (const [mode, port] of [
  ["dev", "4175"],
  ["production", "4176"],
])
  emptyChecks(mode!, `http://127.0.0.1:${port}/?empty`);
