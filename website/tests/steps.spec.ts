import { stepsChecks } from "./steps-checks";
for (const port of ["4180", "4181"])
  stepsChecks(port, `http://127.0.0.1:${port}/zh-CN/components/steps.html`);
