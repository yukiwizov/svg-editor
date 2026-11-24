#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trimEnd();
const baseline = git("rev-parse", "--verify", "refs/tags/final");
const head = git("rev-parse", "HEAD");
const filesAt = ref => git("ls-tree", "-r", "--name-only", ref, "--", "src").split("\n").filter(path => path && /\.(ts|tsx|js|mjs)$/.test(path));
const readAt = (ref, file) => git("show", `${ref}:${file}`);
const lines = source => source.length ? source.split("\n").length : 0;
const complexity = source => {
  const stripped = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, " ");
  return (stripped.match(/\b(if|for|while|case|catch)\b|&&|\|\||\?/g) ?? []).length;
};
const currentFiles = filesAt(head);
const baselineFiles = filesAt(baseline);
const rows = currentFiles.map(file => {
  const source = readAt(head, file);
  return { file, lines: lines(source), complexity: complexity(source) };
});
const baselineComplexity = baselineFiles.reduce((sum, file) => sum + complexity(readAt(baseline, file)), 0);
const currentComplexity = rows.reduce((sum, row) => sum + row.complexity, 0);
const modules = new Map();
for (const row of rows) {
  const name = row.file.split("/")[1] ?? "root";
  const item = modules.get(name) ?? { files: 0, lines: 0, complexity: 0 };
  item.files++; item.lines += row.lines; item.complexity += row.complexity;
  modules.set(name, item);
}
const history = git("log", "--oneline", "--reverse", `${baseline}..${head}`).split("\n").filter(Boolean);
const output = [
  "# Generated Phase 2 metrics", "",
  `- Baseline tag: ${baseline}`,
  `- Measured HEAD: ${head}`,
  `- Commits after baseline: ${history.length}`, "",
  "## Module inventory", "",
  "| Module | Files | Lines | Complexity proxy |",
  "|---|---:|---:|---:|",
  ...Array.from(modules, ([name, item]) => `| ${name} | ${item.files} | ${item.lines} | ${item.complexity} |`).sort(), "",
  "## Complexity comparison", "",
  `- Phase 1 baseline complexity proxy: ${baselineComplexity}`,
  `- Current complexity proxy: ${currentComplexity}`,
  `- Delta: ${currentComplexity - baselineComplexity}`, "",
  "Proxy counts if/for/while/case/catch, &&, || and conditional operators after stripping comments and quoted strings. It is a reproducible trend indicator, not an AST cyclomatic-complexity score.", "",
  "## File inventory", "",
  "| File | Lines | Complexity proxy |",
  "|---|---:|---:|",
  ...rows.map(row => `| ${row.file} | ${row.lines} | ${row.complexity} |`), "",
  "## Commit history", "", ...history.map(item => `- ${item}`), "",
].join("\n");
mkdirSync("docs/metrics", { recursive: true });
writeFileSync("docs/metrics/phase2.md", output);
console.log("generated docs/metrics/phase2.md");
