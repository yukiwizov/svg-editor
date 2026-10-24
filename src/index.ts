#!/usr/bin/env node
import * as readline from "node:readline";
import { CommandRegistry } from "./cli/CommandRegistry";
import { registerBuiltinCommands } from "./cli/builtin-commands";
import { CommandDispatcher } from "./cli/CommandDispatcher";
import { Repl, ReplIO } from "./cli/Repl";
import { EditorContext } from "./commands/EditorContext";

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

async function main(): Promise<void> {
  const registry = new CommandRegistry();
  registerBuiltinCommands(registry);
  const dispatcher = new CommandDispatcher(registry);
  const ctx = new EditorContext();
  const repl = new Repl(makeReadlineIO(), dispatcher, ctx);
  await repl.run();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});