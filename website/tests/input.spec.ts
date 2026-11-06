import { inputChecks } from "./input-checks";
for (const port of ["4180", "4181"])
  inputChecks(port, `http://127.0.0.1:${port}/zh-CN/components/input.html`);
