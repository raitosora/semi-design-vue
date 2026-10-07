import { emptyChecks } from "./empty-checks";
for (const port of ["4180", "4181"])
  emptyChecks(port, `http://127.0.0.1:${port}/zh-CN/components/empty.html`);
