import { breadcrumbChecks } from "./breadcrumb-checks";
for (const port of ["4180", "4181"])
  breadcrumbChecks(
    port,
    `http://127.0.0.1:${port}/zh-CN/components/breadcrumb.html`,
  );
