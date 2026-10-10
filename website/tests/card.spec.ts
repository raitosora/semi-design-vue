import { cardChecks } from "./card-checks";
for (const port of ["4180", "4181"])
  cardChecks(port, `http://127.0.0.1:${port}/zh-CN/components/card.html`);
