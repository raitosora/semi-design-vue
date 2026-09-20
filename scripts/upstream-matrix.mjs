import ts from "typescript";

export function readCurrentExports(text, resolveStar) {
  const source = ts.createSourceFile(
    "entry.ts",
    text,
    ts.ScriptTarget.Latest,
    true,
  );
  if (source.parseDiagnostics.length)
    throw new Error("Invalid current export syntax.");
  const values = [];
  const types = [];
  for (const node of source.statements) {
    if (
      ts.isExportAssignment(node) ||
      node.modifiers?.some((item) => item.kind === ts.SyntaxKind.DefaultKeyword)
    ) {
      values.push("default");
      continue;
    }
    if (ts.isExportDeclaration(node)) {
      if (
        !node.exportClause &&
        resolveStar &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const nested = resolveStar(node.moduleSpecifier.text);
        if (!nested?.values?.length || !Array.isArray(nested.types))
          throw new Error("Empty or invalid export-star inventory.");
        (node.isTypeOnly ? types : values).push(...nested.values);
        types.push(...nested.types);
        continue;
      }
      if (!node.exportClause || !ts.isNamedExports(node.exportClause))
        throw new Error(
          "Current export inventory requires explicit named exports.",
        );
      for (const item of node.exportClause.elements)
        (node.isTypeOnly || item.isTypeOnly ? types : values).push(
          item.name.text,
        );
    } else if (
      node.modifiers?.some((item) => item.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (!ts.isIdentifier(declaration.name))
            throw new Error("Unsupported destructured export.");
          values.push(declaration.name.text);
        }
      } else if (node.name && ts.isIdentifier(node.name)) {
        (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)
          ? types
          : values
        ).push(node.name.text);
      } else throw new Error("Unsupported current export declaration.");
    }
  }
  if (
    new Set(values).size !== values.length ||
    new Set(types).size !== types.length
  )
    throw new Error("Duplicate current exports.");
  return { values: values.sort(), types: types.sort() };
}

export function buildMatrix(upstream, current, facilities = {}) {
  if (
    !upstream?.families?.length ||
    !upstream?.rootExports?.length ||
    !Array.isArray(current?.values) ||
    !Array.isArray(current?.types)
  )
    throw new Error(
      "A nonempty upstream inventory and current export arrays are required.",
    );
  const names = upstream.families.map((family) => family.name);
  if (
    new Set(names).size !== names.length ||
    new Set(upstream.rootExports.map((entry) => entry.name)).size !==
      upstream.rootExports.length
  )
    throw new Error("Duplicate upstream inventory entries.");
  for (const key of Object.keys(facilities))
    if (!names.includes(key))
      throw new Error(`Unknown infrastructure family: ${key}`);
  // Delivery is an explicit acceptance decision. Name overlap is never such a decision.
  // Introduce acceptance records together with the first complete public component.
  const rootExports = upstream.rootExports.map((entry) => ({
    ...entry,
    upstreamExists: true,
    currentExportExists: current.values.includes(entry.name),
    classification: current.values.includes(entry.name)
      ? "infrastructure"
      : "absent",
    publicDelivery: "not-delivered",
    behaviorAcceptance: "not-accepted",
    alignment: current.values.includes(entry.name)
      ? "same-name-different-contract"
      : "missing",
    difference:
      entry.name === "semiGlobal"
        ? "Vue defaults are captured at resolver creation; React createRoot is not implemented. Same name does not imply upstream API parity."
        : "No accepted public implementation, API/type mapping or static-member compatibility contract.",
  }));
  const families = upstream.families.map((family) => ({
    ...family,
    upstreamExists: true,
    currentExports: rootExports
      .filter(
        (entry) => entry.family === family.name && entry.currentExportExists,
      )
      .map((entry) => entry.name),
    infrastructure: facilities[family.name] ?? [],
    publicDelivery: "not-delivered",
    behaviorAcceptance: "not-accepted",
    apiDifference:
      "Public props/events/slots/ref API has not been delivered or behaviorally accepted.",
    typeDifference:
      "Upstream syntax fingerprints are an audit inventory, not compatible Vue declarations.",
    staticDifference:
      "Upstream static members are inventoried; no public Vue static-subcomponent contract is accepted.",
    subpathDifference:
      "Upstream React lib/es and lib/cjs paths are not Vue public component entries.",
  }));
  return {
    schema: 1,
    summary: {
      upstreamFamilies: families.length,
      upstreamRootExports: rootExports.length,
      sameNameRootExports: rootExports.filter(
        (entry) => entry.currentExportExists,
      ).length,
      publiclyDeliveredFamilies: families.filter(
        (entry) => entry.publicDelivery === "delivered",
      ).length,
      behaviorAcceptedFamilies: families.filter(
        (entry) => entry.behaviorAcceptance === "accepted",
      ).length,
    },
    families,
    rootExports,
    current,
    additionalValues: current.values.filter(
      (name) => !rootExports.some((entry) => entry.name === name),
    ),
    acceptancePolicy:
      "No complete public components are accepted. Infrastructure, resources, same-name exports and fixtures remain separate; adding the first public component requires explicit acceptance records and extending this policy.",
  };
}

export function renderMatrix(matrix, pin) {
  const rows = matrix.families.map(
    (entry) =>
      `| ${entry.name} | ${entry.exports.map((item) => (typeof item === "string" ? item : item.name)).join(", ")} | ${entry.currentExports.join(", ") || "无"} | ${entry.infrastructure.map((item) => item.label).join("；") || "无模块专属交付"} | 未交付 | 未验收 |`,
  );
  const exports = matrix.rootExports.map(
    (entry) =>
      `| ${entry.name} | ${entry.family ?? "根级额外 API"} | ${entry.currentExportExists ? "存在；不同契约" : "不存在"} | 未交付 / 未验收 |`,
  );
  return `# 上游对齐与完成度\n\n<!-- Generated by scripts/check-upstream.mjs; edit source inputs and regenerate. -->\n\n固定来源为 [Semi Design ${pin.version}](${pin.repository}/tree/${pin.commit})，commit \`${pin.commit}\`。以下数量由固定源码和当前包入口生成：${matrix.summary.upstreamFamilies} 个模块族、${matrix.summary.upstreamRootExports} 个根具名导出，当前同名根导出 ${matrix.summary.sameNameRootExports} 个，完整公共模块交付 ${matrix.summary.publiclyDeliveredFamilies} 个、公共模块行为验收 ${matrix.summary.behaviorAcceptedFamilies} 个。\n\n模块族只统计根入口相对导出的首层非内部目录。BaseComponent、BaseFoundation、semiGlobal 和外部 AI 数据函数另列根导出，不凑入模块族。计数不是行为覆盖率。\n\n“设施/夹具”列登记实际源码、样式或测试支持，不等于完整组件。当前资源包装和语言字典可通过本地产物消费，但不表示 Icon、Empty 或 LocaleProvider 已完成。\n\n## 模块矩阵\n\n| 上游模块族 | 上游根导出 | 当前同名导出 | 设施/夹具/资源 | 公开交付 | 行为验收 |\n| --- | --- | --- | --- | --- | --- |\n${rows.join("\n")}\n\n## 根具名导出矩阵\n\n| 上游符号 | 模块族 | 当前导出存在性 | 公共对齐状态 |\n| --- | --- | --- | --- |\n${exports.join("\n")}\n\n## API、类型与路径差异\n\n当前 \`semiGlobal\` 是 Vue 初始化默认值设施；没有 React \`createRoot\`，默认值捕获时机也不同。同名不代表 API 或行为对齐。其他上游公共 props、事件、slots、ref、静态子组件和函数仍需逐项交付。\n\n可提交的 \`resources/upstream/baseline.json\` 记录上游每个输入的指纹、类型语法、静态成员、子路径和资源；\`matrix.json\` 另列当前根值/类型导出、六包导出条件与资源支持范围。类型语法指纹用于发现变化，不代表 React 类型已转成 Vue 类型，也不证明语义兼容。动态构造的静态 API 保留解析限制，需要人工复核。当前不提供上游的 React \`lib/es\` / \`lib/cjs\` 路径或公共组件 CJS。\n\n[资源索引](./resource-index.md)、[本地产物与消费方式](./packages.md)和[兼容边界](./compatibility.md)分别说明已交付资源、ESM/声明、纯 Vapor 与 interop、严格安装与 SSR 限制。\n`;
}

export function buildSurfaceDifferences(
  inventory,
  current,
  packageSurfaces,
  registeredResources,
) {
  const targets = {
    "@douyinfe/semi-ui": "semi-ui-vue",
    "@douyinfe/semi-icons": "semi-icons-vue",
    "@douyinfe/semi-icons-lab": "semi-icons-lab-vue",
    "@douyinfe/semi-illustrations": "semi-illustrations-vue",
    "@douyinfe/semi-animation": "semi-animation-vue",
  };
  return {
    types: inventory.typeDeclarations.map((entry) => ({
      ...entry,
      sameNameRootType: current.types.includes(entry.name),
      alignment: "no-accepted-type-mapping",
    })),
    staticMembers: Object.entries(inventory.staticApis).flatMap(
      ([owner, value]) =>
        value.members.map((entry) => ({
          ...entry,
          rootExport: owner,
          currentPublicMemberAccepted: false,
          alignment: "no-accepted-static-contract",
        })),
    ),
    subpaths: inventory.packageSurfaces.flatMap((surface) => {
      const target = packageSurfaces.find(
        (item) => item.name === targets[surface.name],
      );
      return surface.exports.map((entry) => ({
        upstreamPackage: surface.name,
        ...entry,
        currentPackage: target?.name ?? null,
        sameSubpathExists: Boolean(
          target && Object.hasOwn(target.exports, entry.subpath),
        ),
        alignment:
          target && Object.hasOwn(target.exports, entry.subpath)
            ? "same-path-different-contract"
            : "not-exposed",
      }));
    }),
    resources: inventory.resources.map((entry) => {
      const registered = registeredResources[entry.path];
      if (registered && registered.sha256 !== entry.fingerprint)
        throw new Error(
          `Registered resource differs from upstream: ${entry.path}`,
        );
      return {
        ...entry,
        registration: registered ?? null,
        alignment: registered
          ? "registered-source-not-component-acceptance"
          : "not-registered-for-delivery",
      };
    }),
  };
}
