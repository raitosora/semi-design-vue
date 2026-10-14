import { descriptionsChecks } from "../../website/tests/descriptions-checks";
for (const [mode, port] of [
  ["dev", "4175"],
  ["production", "4176"],
])
  descriptionsChecks(mode!, `http://127.0.0.1:${port}/?descriptions`);
