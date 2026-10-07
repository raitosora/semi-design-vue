import { typographyChecks } from "../../website/tests/typography-checks";
for (const [mode, port] of [
  ["dev", "4175"],
  ["production", "4176"],
])
  typographyChecks(mode!, `http://127.0.0.1:${port}/?typography`);
