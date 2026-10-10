import { cardChecks } from "../../website/tests/card-checks";
for (const [mode, port] of [
  ["dev", "4175"],
  ["production", "4176"],
])
  cardChecks(mode!, `http://127.0.0.1:${port}/?card`);
