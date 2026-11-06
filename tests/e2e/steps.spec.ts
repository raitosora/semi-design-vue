import { stepsChecks } from "../../website/tests/steps-checks";
for (const [mode, port] of [
  ["dev", "4175"],
  ["production", "4176"],
])
  stepsChecks(mode!, `http://127.0.0.1:${port}/?steps`);
