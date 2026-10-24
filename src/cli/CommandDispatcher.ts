import { Command, EditCommand } from "../commands/Command";
import { CommandResult, err } from "../commands/CommandResult";
import { EditorContext } from "../commands/EditorContext";
import { CommandRegistry } from "./CommandRegistry";
import { tokenize } from "./Tokenizer";

/**
 * 执行"一行命令"的完整封装：
 *   1. tokenize
 *   2. 从 registry 构建 Command
 *   3. 调 execute
 *   4. 根据 category 决定是否 push 到 history
 *
 * 不负责打印（打印是 Repl + Renderer 的事）。
 */
export class CommandDispatcher {
  constructor(private readonly registry: CommandRegistry) {}

  dispatch(line: string, ctx: EditorContext): CommandResult {
    const t = tokenize(line);
    if (t.error) return err(t.error);
    if (t.tokens.length === 0) return { lines: [] }; // 空行或注释

    const [name, ...args] = t.tokens;

    const build = this.registry.build(name, args);
    if (!build) return err(`unknown command: ${name}`);
    if ("error" in build) return err(build.error);

    const command: Command = build.command;
    const result = command.execute(ctx);

    // edit 命令成功后入 undo 栈（document/display/history 由命令自身或 Repl 决定）
    if (!result.error && command.category === "edit") {
      // category === "edit" 时一定是 EditCommand（协议约定，见 commands/Command.ts）
      ctx.history.push(command as EditCommand);
    }

    return result;
  }
}