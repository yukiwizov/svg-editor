#!/usr/bin/env node
import * as readline from "node:readline";
import * as fs from "node:fs";
import * as path from "node:path";
import { CommandRegistry } from "./cli/CommandRegistry";
import { registerBuiltinCommands } from "./cli/builtin-commands";
import { CommandDispatcher } from "./cli/CommandDispatcher";
import { Repl, ReplIO } from "./cli/Repl";
import { EditorContext } from "./commands/EditorContext";
import { PluginHost, PluginManifest } from "./plugins/PluginHost";
import builtinShapes from "./plugins/shapes/plugin";

/**
 * 用 node:readline 实现 ReplIO。
 * - 交互终端：显示 "svg> " 提示符
 * - 管道输入：不显示提示符（terminal=false）
 */
function makeReadlineIO(): ReplIO {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "svg> ",
    terminal: process.stdin.isTTY === true,
  });
  return {
    write(line: string): void {
      process.stdout.write(line + "\n");
    },
    async *read(): AsyncIterable<string> {
      rl.prompt();
      for await (const line of rl) {
        yield line;
        rl.prompt();
      }
    },
  };
}

async function loadPlugins(host: PluginHost): Promise<void> {
  const configPath = path.resolve(process.cwd(), "plugins.config.json");
  if (!fs.existsSync(configPath)) return;
  let config: unknown;
  try { config = JSON.parse(fs.readFileSync(configPath, "utf8")); } catch { console.error("error: invalid plugin config"); return; }
  if (!config || typeof config !== "object" || !Array.isArray((config as {plugins?: unknown}).plugins)) {
    console.error("error: invalid plugin config"); return;
  }
  for (const entry of (config as {plugins: unknown[]}).plugins) {
    if (!entry || typeof entry !== "object" || typeof (entry as {module?: unknown}).module !== "string" || ((entry as {enabled?: unknown}).enabled !== undefined && typeof (entry as {enabled?: unknown}).enabled !== "boolean")) {
      console.error("error: invalid plugin config"); continue;
    }
    const item = entry as {module: string; enabled?: boolean; options?: Record<string, unknown>};
    if (item.enabled === false) continue;
    const resolved = item.module.startsWith(".") ? path.resolve(path.dirname(configPath), item.module) : item.module;
    let resolvedModule: string;
    try { resolvedModule = require.resolve(resolved, { paths: [path.dirname(configPath)] }); }
    catch { console.error(`error: plugin not found: ${item.module}`); continue; }
    let loaded: unknown;
    try { loaded = require(resolvedModule); }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`error: plugin failed to activate: ${item.module} (${message})`); continue;
    }
    const plugin = (loaded as {default?: PluginManifest})?.default;
    if (!plugin) { console.error(`error: plugin has no default export: ${item.module}`); continue; }
    try { host.activate(plugin, item.options ?? {}); }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.startsWith("manifest mismatch:")) console.error(`error: plugin ${message}`);
      else if (message.startsWith("duplicate registration:")) console.error(`error: ${message}`);
      else console.error(`error: plugin failed to activate: ${plugin.name} (${message})`);
    }
  }
}

async function main(): Promise<void> {
  const registry = new CommandRegistry();
  registerBuiltinCommands(registry);
  const dispatcher = new CommandDispatcher(registry);
  const ctx = new EditorContext();
  const host = new PluginHost(ctx.factory, registry, ctx.attributeHandlers, ctx.treeDecorators);
  host.activate(builtinShapes);
  await loadPlugins(host);
  const repl = new Repl(makeReadlineIO(), dispatcher, ctx);
  await repl.run();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});