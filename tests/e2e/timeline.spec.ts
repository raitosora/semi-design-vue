import { timelineChecks } from "../../website/tests/timeline-checks";
for (const [mode, port] of [
  ["dev", "4175"],
  ["production", "4176"],
])
  timelineChecks(mode!, `http://127.0.0.1:${port}/?timeline`);
