import { breadcrumbChecks } from "../../website/tests/breadcrumb-checks";
for (const [mode, port] of [
  ["dev", "4175"],
  ["production", "4176"],
])
  breadcrumbChecks(mode!, `http://127.0.0.1:${port}/?breadcrumb`);
