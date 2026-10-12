import { listChecks } from "../../website/tests/list-checks";
for (const [mode, port] of [
  ["dev", "4175"],
  ["production", "4176"],
])
  listChecks(mode!, `http://127.0.0.1:${port}/?list`);
