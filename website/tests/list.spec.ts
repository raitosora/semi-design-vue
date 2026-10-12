import { listChecks } from "./list-checks";
for (const port of ["4180", "4181"])
  listChecks(port, `http://127.0.0.1:${port}/zh-CN/components/list.html`);
