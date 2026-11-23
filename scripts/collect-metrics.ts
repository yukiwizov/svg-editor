import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as ts from "typescript";

type Layer = "内核" | "装配处" | "插件";

interface FileInfo {
  relPath: string;
  layer: Layer;
  lines: number;
  complexity: number;
  responsibility: string;
}

const REPO_ROOT = process.cwd();
const OUT_DIR = path.join(REPO_ROOT, "docs", "metrics");
const BASE_REF = process.argv[2] || "final";

const EXCLUDE_PREFIXES = [
  "node_modules/",
  "dist/",
  ".git/",
  "vscode-svg-extension/",
  "docs/",
];

const RESPONSIBILITY_OVERRIDES: Record<string, string> = {
  "src/index.ts": "CLI 进程入口、Readline IO 适配与启动装配",
  "src/cli/CommandRegistry.ts": "命令注册表",
  "src/cli/CommandDispatcher.ts": "命令行分发与执行协调",
  "src/cli/Repl.ts": "交互式/管道 REPL 主循环",
  "src/cli/Tokenizer.ts": "命令行词法切分与引号处理",
  "src/cli/Renderer.ts": "文档与结构树文本渲染器",
  "src/cli/TreeCommand.ts": "结构树查看命令",
  "src/cli/ShowCommand.ts": "图形详情查看命令",
  "src/cli/HelpCommand.ts": "帮助信息命令",
  "src/cli/HelpText.ts": "帮助文案生成",
  "src/cli/builtin-commands.ts": "Phase 1 内置命令注册",
};

function isExcluded(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, "/");
  if (EXCLUDE_PREFIXES.some((p) => normalized.startsWith(p))) return true;
  if (normalized === "package-lock.json") return true;
  return false;
}

function classifyLayer(relPath: string): Layer {
  const n = relPath.replace(/\\/g, "/");
  if (n.startsWith("src/plugins/") || n.startsWith("plugins/")) {
    return "插件";
  }
  if (
    n === "src/index.ts" ||
    n.includes("bootstrap") ||
    n.includes("loader") ||
    n.includes("assembler") ||
    n.endsWith("plugins.config.json")
  ) {
    return "装配处";
  }
  return "内核";
}

function inferResponsibility(relPath: string): string {
  const n = relPath.replace(/\\/g, "/");
  if (RESPONSIBILITY_OVERRIDES[n]) return RESPONSIBILITY_OVERRIDES[n];
  if (n.endsWith(".test.ts")) return `单元测试：${path.basename(n, ".test.ts")}`;
  if (n.startsWith("src/core/")) return `核心领域模型与注册/工厂（${path.basename(n, ".ts")}）`;
  if (n.startsWith("src/io/")) return `SVG 序列化/反序列化与 ID 分配（${path.basename(n, ".ts")}）`;
  if (n.startsWith("src/commands/")) return `编辑/文档/历史命令与上下文（${path.basename(n, ".ts")}）`;
  if (n.startsWith("src/cli/")) return `CLI 交互与渲染组件（${path.basename(n, ".ts")}）`;
  if (n.startsWith("src/plugins/") || n.startsWith("plugins/")) {
    return `扩展插件模块（${path.basename(n)}）`;
  }
  return "项目配置/源码文件";
}

function walkFiles(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(REPO_ROOT, full).replace(/\\/g, "/");
    if (isExcluded(rel)) continue;
    if (entry.isDirectory()) {
      walkFiles(full, acc);
    } else if (entry.isFile()) {
      acc.push(rel);
    }
  }
  return acc;
}

function countLines(content: string): number {
  if (content.length === 0) return 0;
  return content.split(/\r?\n/).length;
}

function calcFileComplexity(relPath: string, content: string): number {
  if (!/\.(ts|tsx|js|mjs|cjs)$/.test(relPath)) return 0;
  const sf = ts.createSourceFile(relPath, content, ts.ScriptTarget.Latest, true);
  let total = 0;

  function functionComplexity(node: ts.Node): number {
    let cc = 1;
    function visitBranch(n: ts.Node): void {
      // 不下钻进入嵌套函数，嵌套函数自己算一份
      if (
        n !== node &&
        (ts.isFunctionDeclaration(n) ||
          ts.isFunctionExpression(n) ||
          ts.isArrowFunction(n) ||
          ts.isMethodDeclaration(n) ||
          ts.isGetAccessorDeclaration(n) ||
          ts.isSetAccessorDeclaration(n))
      ) {
        return;
      }
      if (
        ts.isIfStatement(n) ||
        ts.isConditionalExpression(n) ||
        ts.isCaseClause(n) ||
        ts.isCatchClause(n) ||
        ts.isForStatement(n) ||
        ts.isForInStatement(n) ||
        ts.isForOfStatement(n) ||
        ts.isWhileStatement(n) ||
        ts.isDoStatement(n)
      ) {
        cc += 1;
      } else if (ts.isBinaryExpression(n)) {
        const op = n.operatorToken.kind;
        if (
          op === ts.SyntaxKind.AmpersandAmpersandToken ||
          op === ts.SyntaxKind.BarBarToken ||
          op === ts.SyntaxKind.QuestionQuestionToken
        ) {
          cc += 1;
        }
      }
      ts.forEachChild(n, visitBranch);
    }
    ts.forEachChild(node, visitBranch);
    return cc;
  }

  function walk(node: ts.Node): void {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isGetAccessorDeclaration(node) ||
      ts.isSetAccessorDeclaration(node)
    ) {
      total += functionComplexity(node);
    }
    ts.forEachChild(node, walk);
  }

  walk(sf);
  return total;
}

function getBaseFileContent(ref: string, relPath: string): string | null {
  try {
    return execSync(`git show ${ref}:${relPath}`, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

function hasRef(ref: string): boolean {
  try {
    execSync(`git rev-parse --verify ${ref}`, {
      cwd: REPO_ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function collectVscodeStats(): { files: number; lines: number } {
  const dir = path.join(REPO_ROOT, "vscode-svg-extension");
  if (!fs.existsSync(dir)) return { files: 0, lines: 0 };
  let files = 0;
  let lines = 0;
  const stack = [dir];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "out" || entry.name === "dist") {
        continue;
      }
      const full = path.join(cur, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) {
        files += 1;
        lines += countLines(fs.readFileSync(full, "utf8"));
      }
    }
  }
  return { files, lines };
}

function main(): void {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const refExists = hasRef(BASE_REF);
  const headCommit = execSync("git rev-parse --short HEAD", {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).trim();

  const currentFiles = walkFiles(REPO_ROOT).sort();
  const fileInfos: FileInfo[] = currentFiles.map((relPath) => {
    const content = fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
    return {
      relPath,
      layer: classifyLayer(relPath),
      lines: countLines(content),
      complexity: calcFileComplexity(relPath, content),
      responsibility: inferResponsibility(relPath),
    };
  });

  // 汇总三类行数与圈复杂度
  const layers: Layer[] = ["内核", "装配处", "插件"];
  const curByLayer: Record<Layer, { files: number; lines: number; complexity: number }> = {
    内核: { files: 0, lines: 0, complexity: 0 },
    装配处: { files: 0, lines: 0, complexity: 0 },
    插件: { files: 0, lines: 0, complexity: 0 },
  };
  for (const f of fileInfos) {
    curByLayer[f.layer].files += 1;
    curByLayer[f.layer].lines += f.lines;
    curByLayer[f.layer].complexity += f.complexity;
  }

  const baseByLayer: Record<Layer, { files: number; lines: number; complexity: number }> = {
    内核: { files: 0, lines: 0, complexity: 0 },
    装配处: { files: 0, lines: 0, complexity: 0 },
    插件: { files: 0, lines: 0, complexity: 0 },
  };

  if (refExists) {
    const baseListRaw = execSync(`git ls-tree -r --name-only ${BASE_REF}`, {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    for (const relPath of baseListRaw.split(/\r?\n/).filter(Boolean)) {
      if (isExcluded(relPath)) continue;
      const content = getBaseFileContent(BASE_REF, relPath);
      if (content === null) continue;
      const layer = classifyLayer(relPath);
      baseByLayer[layer].files += 1;
      baseByLayer[layer].lines += countLines(content);
      baseByLayer[layer].complexity += calcFileComplexity(relPath, content);
    }
  }

  // 1. files.md
  const filesMd = [
    `# CLI 文件清单与职责（基准: \`${BASE_REF}\`，当前 HEAD: \`${headCommit}\`）`,
    "",
    "> 由 `scripts/collect-metrics.ts` 自动生成，排除 `node_modules/`、`dist/`、`vscode-svg-extension/` 与 `docs/`。",
    "",
    "| 文件路径 | 分类 | 行数 | 圈复杂度 | 职责 |",
    "|---|---:|---:|---:|---|",
    ...fileInfos.map(
      (f) =>
        `| \`${f.relPath}\` | ${f.layer} | ${f.lines} | ${f.complexity} | ${f.responsibility} |`
    ),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(OUT_DIR, "files.md"), filesMd, "utf8");

  // 2. lines.md
  const totalCurLines = layers.reduce((s, l) => s + curByLayer[l].lines, 0);
  const totalBaseLines = layers.reduce((s, l) => s + baseByLayer[l].lines, 0);
  const vscodeStats = collectVscodeStats();

  const linesMd = [
    `# 行数统计：内核 / 装配处 / 插件（对比 \`${BASE_REF}\` → \`${headCommit}\`）`,
    "",
    "| 类别 | 基准文件数 | 当前文件数 | 基准行数 | 当前行数 | 行数增量 |",
    "|---|---:|---:|---:|---:|---:|",
    ...layers.map((l) => {
      const b = baseByLayer[l];
      const c = curByLayer[l];
      const delta = c.lines - b.lines;
      const sign = delta > 0 ? `+${delta}` : `${delta}`;
      return `| ${l} | ${b.files} | ${c.files} | ${b.lines} | ${c.lines} | ${sign} |`;
    }),
    `| **CLI 合计** | ${layers.reduce((s, l) => s + baseByLayer[l].files, 0)} | ${layers.reduce((s, l) => s + curByLayer[l].files, 0)} | ${totalBaseLines} | ${totalCurLines} | ${totalCurLines - totalBaseLines >= 0 ? `+${totalCurLines - totalBaseLines}` : totalCurLines - totalBaseLines} |`,
    "",
    `> 独立扩展（不混入 CLI 重构增量）：\`vscode-svg-extension/\` 当前文件数 **${vscodeStats.files}**，总行数 **${vscodeStats.lines}**。`,
    "",
  ].join("\n");
  fs.writeFileSync(path.join(OUT_DIR, "lines.md"), linesMd, "utf8");

  // 3. complexity.md
  const totalCurCc = layers.reduce((s, l) => s + curByLayer[l].complexity, 0);
  const totalBaseCc = layers.reduce((s, l) => s + baseByLayer[l].complexity, 0);

  const ccMd = [
    `# 圈复杂度统计与增量（对比 \`${BASE_REF}\` → \`${headCommit}\`）`,
    "",
    "- 统计口径：对 TypeScript/JavaScript 函数与方法逐个计算圈复杂度（基础值 `1` + 分支/逻辑短路/异常分支数），按文件与类别求和。",
    "",
    "| 类别 | 基准圈复杂度 | 当前圈复杂度 | 圈复杂度增量 |",
    "|---|---:|---:|---:|",
    ...layers.map((l) => {
      const b = baseByLayer[l].complexity;
      const c = curByLayer[l].complexity;
      const delta = c - b;
      const sign = delta > 0 ? `+${delta}` : `${delta}`;
      return `| ${l} | ${b} | ${c} | ${sign} |`;
    }),
    `| **CLI 合计** | ${totalBaseCc} | ${totalCurCc} | ${totalCurCc - totalBaseCc >= 0 ? `+${totalCurCc - totalBaseCc}` : totalCurCc - totalBaseCc} |`,
    "",
  ].join("\n");
  fs.writeFileSync(path.join(OUT_DIR, "complexity.md"), ccMd, "utf8");

  console.log(`Metrics generated in docs/metrics/ (base=${BASE_REF}, head=${headCommit})`);
}

main();