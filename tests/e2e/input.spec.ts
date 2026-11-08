import { inputChecks } from "../../website/tests/input-checks";
for (const [mode, port] of [
  ["dev", "4175"],
  ["production", "4176"],
])
  inputChecks(mode!, `http://127.0.0.1:${port}/?input`);
