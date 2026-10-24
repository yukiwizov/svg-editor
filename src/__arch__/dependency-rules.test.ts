import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * 架构约束的自动化验证（对应 doc/README 的"依赖方向规则"）。
 *
 * 规则：core ← io ← commands ← cli ← index
 *  - core 不得 import io / commands / cli
 *  - io   不得 import commands / cli
 *  - commands 不得 import cli
 *
 * 违反时本测试失败，CI 即可抓住架构腐化。
 */

const SRC_ROOT = path.resolve(__dirname, "..");
const DIRS = {
  core: path.join(SRC_ROOT, "core"),
  io: path.join(SRC_ROOT, "io"),
  commands: path.join(SRC_ROOT, "commands"),
  cli: path.join(SRC_ROOT, "cli"),
};

/** 遍历 dir 下所有非测试的 .ts 文件（跳过 __test-utils__）。 */
function collectSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__test-utils__") continue;
      if (entry.name === "__arch__") continue;
      out.push(...collectSourceFiles(full));
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts")
    ) {
      out.push(full);
    }
  }
  return out;
}

/** 提取文件里所有 from "..." 的路径（含 import ... from / export ... from）。 */
function extractImportPaths(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const re = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;
  const paths: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    paths.push(m[1]);
  }
  return paths;
}

/** 把 import path 解析为绝对文件路径（仅对相对路径有效）。 */
function resolvePath(filePath: string, importPath: string): string | null {
  if (!importPath.startsWith(".")) return null;
  return path.resolve(path.dirname(filePath), importPath);
}

/** 判断绝对路径 filePath 属于哪个层；不属于返回 null。 */
function classify(filePath: string): keyof typeof DIRS | null {
  for (const [name, dir] of Object.entries(DIRS) as [keyof typeof DIRS, string][]) {
    if (filePath === dir) return name;
    if (filePath.startsWith(dir + path.sep)) return name;
  }
  return null;
}

/** 检查 dirName 层所有文件是否 import 了 forbidden 层里的任何文件。 */
function checkNoCrossImport(
  fromDir: keyof typeof DIRS,
  forbidden: Array<keyof typeof DIRS>,
): string[] {
  const violations: string[] = [];
  const files = collectSourceFiles(DIRS[fromDir]);
  for (const file of files) {
    for (const imp of extractImportPaths(file)) {
      const resolved = resolvePath(file, imp);
      if (resolved === null) continue; // 外部依赖（node:fs / vitest / 等）不管
      const layer = classify(resolved);
      if (layer !== null && forbidden.includes(layer)) {
        violations.push(
          `${path.relative(SRC_ROOT, file)} imports ${imp} (forbidden: ${fromDir} -> ${layer})`,
        );
      }
    }
  }
  return violations;
}

describe("架构约束 — 依赖方向", () => {
  it("core 不得 import io / commands / cli", () => {
    const v = checkNoCrossImport("core", ["io", "commands", "cli"]);
    expect(v).toEqual([]);
  });

  it("io 不得 import commands / cli", () => {
    const v = checkNoCrossImport("io", ["commands", "cli"]);
    expect(v).toEqual([]);
  });

  it("commands 不得 import cli", () => {
    const v = checkNoCrossImport("commands", ["cli"]);
    expect(v).toEqual([]);
  });
});

describe("架构约束 — 按名分派唯一性（结构性检查）", () => {
  /**
   * "按名字分派"只允许两个位置：
   *  - core/ShapeFactory.ts（类型名 → 类）
   *  - cli/CommandRegistry.ts（命令名 → 构造器）
   *
   * 本测试扫描源码，搜索 "switch (.*getTagName" 和 "getTagName() ===" 这类
   * 贫血分派的典型信号。允许出现在 describe* 方法的内部实现里，但不允许
   * 出现在命令层（commands/）或其它散落位置。
   */
  it("commands 层不出现 getTagName() 的字符串比较", () => {
    const violations: string[] = [];
    for (const file of collectSourceFiles(DIRS.commands)) {
      const content = fs.readFileSync(file, "utf-8");
      // 检测 getTagName() === "xxx" / getTagName() == 'xxx'
      const re = /getTagName\(\)\s*[!=]==?\s*['"]/g;
      if (re.test(content)) {
        violations.push(path.relative(SRC_ROOT, file));
      }
    }
    expect(violations).toEqual([]);
  });

  it("commands 层不 switch 任何东西（都用多态或显式检查）", () => {
    const violations: string[] = [];
    for (const file of collectSourceFiles(DIRS.commands)) {
      const content = fs.readFileSync(file, "utf-8");
      // 排除注释行后检查是否出现 "switch ("
      const noComments = content
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "");
      if (/\bswitch\s*\(/.test(noComments)) {
        violations.push(path.relative(SRC_ROOT, file));
      }
    }
    expect(violations).toEqual([]);
  });
});